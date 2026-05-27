import { getImageStyle } from "@/lib/imageStyles";
import { resolveStyleReferenceForApi } from "@/lib/server/styleReference";
import { ApiError } from "./errors";
import { logApiCall, summarizePayload, truncate } from "./logger";
import {
  getImageGenerationModalities,
  getOpenRouterImageModel,
  requireOpenRouterClient,
} from "./openrouter";

const PLACEHOLDER_IMAGE =
  "https://cdn.iconscout.com/icon/free/png-256/free-error-2653315-2202987.png";

function buildImageGenerationContent(
  promptText,
  style,
  includeReferenceImage,
  referenceDataUrl
) {
  const content = [{ type: "text", text: promptText }];

  if (includeReferenceImage && referenceDataUrl && style.referenceInstruction) {
    content[0].text = `${promptText} ${style.referenceInstruction}`;
    content.push({
      type: "image_url",
      imageUrl: { url: referenceDataUrl },
    });
  }

  return content;
}

function providerStatus(error) {
  return error.status ?? error.statusCode ?? error.rawResponse?.status ?? 502;
}

function providerMessage(error) {
  return (
    error.error?.message ||
    error.body?.error?.message ||
    error.body?.message ||
    error.message ||
    "Image provider failed"
  );
}

function isProviderError(error) {
  return providerStatus(error) >= 400;
}

function extractImageUrls(message) {
  const images = message?.images;
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  return images
    .map((image) => image?.imageUrl?.url ?? image?.image_url?.url)
    .filter((url) => typeof url === "string" && url.length > 0);
}

/** Log-friendly view of the assistant message (no full data URLs). */
function summarizeAssistantMessage(message) {
  if (!message || typeof message !== "object") {
    return { present: false };
  }

  const images = message.images;
  const imageEntries = Array.isArray(images)
    ? images.map((image, index) => {
        const url = image?.imageUrl?.url ?? image?.image_url?.url;
        if (typeof url !== "string" || url.length === 0) {
          return { index, url: null, keys: Object.keys(image || {}) };
        }
        if (url.startsWith("data:")) {
          return { index, urlType: "data", urlLength: url.length };
        }
        return { index, urlType: "remote", urlPreview: truncate(url, 80) };
      })
    : null;

  const content = message.content;
  let contentPreview = "";
  if (typeof content === "string") {
    contentPreview = truncate(content, 200);
  } else if (content != null) {
    contentPreview = truncate(JSON.stringify(content), 200);
  }

  return {
    role: message.role,
    finishReason: message.finish_reason ?? message.finishReason,
    messageKeys: Object.keys(message),
    contentLength: typeof content === "string" ? content.length : null,
    contentPreview,
    imageCount: Array.isArray(images) ? images.length : 0,
    images: imageEntries,
  };
}

function urlsFromResponse(response) {
  const message = response?.choices?.[0]?.message;
  return {
    urls: extractImageUrls(message),
    message,
  };
}

async function sendImageRequest({
  client,
  model,
  fullPrompt,
  style,
  includeReferenceImage,
  referenceDataUrl,
}) {
  return client.chat.send({
    chatRequest: {
      model,
      stream: false,
      modalities: getImageGenerationModalities(model),
      messages: [
        {
          role: "user",
          content: buildImageGenerationContent(
            fullPrompt,
            style,
            includeReferenceImage,
            referenceDataUrl
          ),
        },
      ],
      imageConfig: {
        aspect_ratio: "16:9",
      },
    },
  });
}

export async function generateImage(prompt, imageStyle, imageModel) {
  if (!prompt || typeof prompt !== "string") {
    throw new ApiError("prompt is required", 400);
  }

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("OpenRouter image", { mock: true }).finish();
    return [PLACEHOLDER_IMAGE];
  }

  const style = getImageStyle(imageStyle);
  const model = getOpenRouterImageModel(imageModel);
  const client = requireOpenRouterClient("Image generation route");
  const fullPrompt = `${prompt.trim()}${style.promptSuffix}`;
  const wantsReferenceImage = Boolean(
    style.referenceImageUrl && style.referenceInstruction
  );
  let referenceDataUrl = null;
  if (wantsReferenceImage) {
    try {
      referenceDataUrl = await resolveStyleReferenceForApi(
        style.referenceImageUrl
      );
    } catch (error) {
      console.warn(
        "Could not load style reference from disk; generating without reference.",
        { style: style.id, error: error.message }
      );
    }
  }
  const hasReferenceImage = Boolean(referenceDataUrl);

  const log = logApiCall("OpenRouter image", {
    provider: "openrouter",
    model,
    imageStyle: style.id,
    imageModel: model,
    request: summarizePayload({
      prompt,
      imageStyle: style.id,
      imageModel: model,
      referenceImage: hasReferenceImage,
    }),
  });

  const baseRequest = {
    client,
    model,
    fullPrompt,
    style,
    includeReferenceImage: hasReferenceImage,
    referenceDataUrl,
  };

  try {
    let retriedWithoutReference = false;
    let retriedEmptyResponse = false;
    let response;

    const requestWithAspect = { ...baseRequest, aspectRatio };

    try {
      response = await sendImageRequest(requestWithAspect);
    } catch (error) {
      if (!hasReferenceImage || !isProviderError(error)) {
        throw error;
      }

      retriedWithoutReference = true;
      console.warn(
        "OpenRouter image request failed with a style reference; retrying without the reference image.",
        {
          model,
          status: providerStatus(error),
          error: providerMessage(error),
        }
      );
      response = await sendImageRequest({
        ...requestWithAspect,
        includeReferenceImage: false,
        referenceDataUrl: null,
      });
    }

    let { urls, message } = urlsFromResponse(response);
    const activeRequest = retriedWithoutReference
      ? {
          ...requestWithAspect,
          includeReferenceImage: false,
          referenceDataUrl: null,
        }
      : requestWithAspect;

    if (urls.length === 0) {
      console.warn(
        "OpenRouter returned no image URLs; retrying once with the same request.",
        { model, message: summarizeAssistantMessage(message) }
      );
      retriedEmptyResponse = true;
      response = await sendImageRequest(activeRequest);
      ({ urls, message } = urlsFromResponse(response));
    }

    if (urls.length > 0) {
      log.finish({
        images: urls.length,
        retriedWithoutReference,
        retriedEmptyResponse,
      });
      return urls;
    }

    log.fail(new ApiError("No image URL returned from provider", 502), {
      status: 502,
      message: summarizeAssistantMessage(message),
      retriedEmptyResponse,
    });
    throw new ApiError("No image URL returned from provider", 502);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      const status = providerStatus(error);
      const message = providerMessage(error);
      log.fail(error, { status, providerMessage: truncate(message, 200) });
      throw new ApiError(`Image provider failed: ${message}`, status);
    }
    throw error;
  }
}
