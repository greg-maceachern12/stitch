import { getImageSizeForModel } from "@/lib/imageModels";
import { getImageStyle, resolveStyleReferenceUrl } from "@/lib/imageStyles";
import { ApiError } from "./errors";
import { logApiCall, summarizePayload, truncate } from "./logger";
import {
  getImageGenerationModalities,
  getOpenRouterImageModel,
  requireOpenRouterClient,
} from "./openrouter";

const PLACEHOLDER_IMAGE =
  "https://cdn.iconscout.com/icon/free/png-256/free-error-2653315-2202987.png";

function buildImageGenerationContent(promptText, style, includeReferenceImage) {
  const content = [{ type: "text", text: promptText }];

  const referenceUrl = resolveStyleReferenceUrl(style.referenceImageUrl);
  if (includeReferenceImage && referenceUrl && style.referenceInstruction) {
    content[0].text = `${promptText} ${style.referenceInstruction}`;
    content.push({
      type: "image_url",
      imageUrl: { url: referenceUrl },
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

async function sendImageRequest({
  client,
  model,
  fullPrompt,
  style,
  includeReferenceImage,
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
            includeReferenceImage
          ),
        },
      ],
      imageConfig: {
        aspect_ratio: "16:9",
        image_size: getImageSizeForModel(model),
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
  const hasReferenceImage = Boolean(
    resolveStyleReferenceUrl(style.referenceImageUrl) && style.referenceInstruction
  );

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

  try {
    let response;
    let retriedWithoutReference = false;

    try {
      response = await sendImageRequest({
        client,
        model,
        fullPrompt,
        style,
        includeReferenceImage: hasReferenceImage,
      });
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
        client,
        model,
        fullPrompt,
        style,
        includeReferenceImage: false,
      });
    }

    const urls = extractImageUrls(response.choices?.[0]?.message);
    if (urls.length > 0) {
      log.finish({
        images: urls.length,
        retriedWithoutReference,
      });
      return urls;
    }

    log.fail(new ApiError("No image URL returned from provider", 502), {
      status: 502,
      response: truncate(
        response.choices?.[0]?.message?.content || "",
        200
      ),
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
