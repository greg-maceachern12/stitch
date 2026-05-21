import { ApiError } from "./errors";
import { logApiCall, summarizePayload, truncate } from "./logger";
import {
  getOpenRouterImageModel,
  requireOpenRouterClient,
} from "./openrouter";

const PLACEHOLDER_IMAGE =
  "https://cdn.iconscout.com/icon/free/png-256/free-error-2653315-2202987.png";

const IMAGE_STYLE_SUFFIX =
  ", cinematic painted illustration, oil painting, visible brushstrokes, dramatic cinematic lighting, rich color palette, widescreen composition, atmospheric depth, painterly, film still";

function extractImageUrls(message) {
  const images = message?.images;
  if (!Array.isArray(images) || images.length === 0) {
    return [];
  }

  return images
    .map((image) => image?.imageUrl?.url ?? image?.image_url?.url)
    .filter((url) => typeof url === "string" && url.length > 0);
}

export async function generateImage(prompt, cheapModel = false) {
  if (!prompt || typeof prompt !== "string") {
    throw new ApiError("prompt is required", 400);
  }

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("OpenRouter image", { mock: true }).finish();
    return [PLACEHOLDER_IMAGE];
  }

  const model = getOpenRouterImageModel(cheapModel);
  const client = requireOpenRouterClient("Image generation route");
  const fullPrompt = `${prompt.trim()}${IMAGE_STYLE_SUFFIX}`;

  const log = logApiCall("OpenRouter image", {
    provider: "openrouter",
    model,
    cheapModel,
    request: summarizePayload({ prompt }),
  });

  try {
    const response = await client.chat.send({
      chatRequest: {
        model,
        stream: false,
        modalities: ["image", "text"],
        messages: [
          {
            role: "user",
            content: fullPrompt,
          },
        ],
        imageConfig: {
          aspect_ratio: "16:9",
          image_size: cheapModel ? "1K" : "2K",
        },
      },
    });

    const urls = extractImageUrls(response.choices?.[0]?.message);
    if (urls.length > 0) {
      log.finish({ images: urls.length });
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
      log.fail(error);
    }
    throw error;
  }
}
