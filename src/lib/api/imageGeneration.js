import { getImageStyle } from "@/lib/imageStyles";
import { resolveStyleReferenceForApi } from "@/lib/server/styleReference";
import { ApiError } from "./errors";
import { logApiCall, summarizePayload, truncate } from "./logger";
import {
  generateOpenRouterImage,
  getOpenRouterImageModel,
} from "./openrouter";

const PLACEHOLDER_IMAGE =
  "https://cdn.iconscout.com/icon/free/png-256/free-error-2653315-2202987.png";

/** Landscape ratio for all generated book images (OpenRouter Image API). */
const DEFAULT_IMAGE_ASPECT_RATIO = "16:9";

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

function toDataUrl(b64, mediaType) {
  const type = mediaType || "image/png";
  return `data:${type};base64,${b64}`;
}

function extractImageUrls(payload) {
  const data = payload?.data;
  if (!Array.isArray(data) || data.length === 0) {
    return [];
  }

  return data
    .map((image) => {
      if (typeof image?.url === "string" && image.url.length > 0) {
        return image.url;
      }
      const b64 = image?.b64_json ?? image?.b64Json;
      if (typeof b64 === "string" && b64.length > 0) {
        return toDataUrl(b64, image?.media_type ?? image?.mediaType);
      }
      return null;
    })
    .filter(Boolean);
}

/** Log-friendly view of an Image API response (no full base64). */
function summarizeImageResponse(payload) {
  if (!payload || typeof payload !== "object") {
    return { present: false };
  }

  const data = payload.data;
  const imageEntries = Array.isArray(data)
    ? data.map((image, index) => {
        const url = image?.url;
        const b64 = image?.b64_json ?? image?.b64Json;
        if (typeof url === "string" && url.length > 0) {
          return { index, urlType: "remote", urlPreview: truncate(url, 80) };
        }
        if (typeof b64 === "string" && b64.length > 0) {
          return {
            index,
            urlType: "data",
            mediaType: image?.media_type ?? image?.mediaType ?? null,
            urlLength: b64.length,
          };
        }
        return { index, url: null, keys: Object.keys(image || {}) };
      })
    : null;

  return {
    created: payload.created ?? null,
    payloadKeys: Object.keys(payload),
    imageCount: Array.isArray(data) ? data.length : 0,
    images: imageEntries,
    usage: payload.usage ?? null,
  };
}

function urlsFromResponse(payload) {
  return {
    urls: extractImageUrls(payload),
    payload,
  };
}

function buildInputReferences(referenceDataUrl) {
  if (!referenceDataUrl) return undefined;
  return [
    {
      type: "image_url",
      image_url: { url: referenceDataUrl },
    },
  ];
}

async function sendImageRequest({
  model,
  fullPrompt,
  style,
  includeReferenceImage,
  referenceDataUrl,
  aspectRatio = DEFAULT_IMAGE_ASPECT_RATIO,
}) {
  const useReference =
    includeReferenceImage && referenceDataUrl && style.referenceInstruction;
  const prompt = useReference
    ? `${fullPrompt} ${style.referenceInstruction}`
    : fullPrompt;

  return generateOpenRouterImage({
    model,
    prompt,
    aspectRatio,
    inputReferences: useReference
      ? buildInputReferences(referenceDataUrl)
      : undefined,
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

    const requestWithAspect = {
      ...baseRequest,
      aspectRatio: DEFAULT_IMAGE_ASPECT_RATIO,
    };

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

    let { urls, payload } = urlsFromResponse(response);
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
        { model, response: summarizeImageResponse(payload) }
      );
      retriedEmptyResponse = true;
      response = await sendImageRequest(activeRequest);
      ({ urls, payload } = urlsFromResponse(response));
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
      response: summarizeImageResponse(payload),
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
