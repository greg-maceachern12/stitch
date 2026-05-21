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

/** Style reference sent with every image generation request */
const REFERENCE_IMAGE_URL =
  "https://images.squarespace-cdn.com/content/v1/5b0ec7364cde7a026389229d/6d06a001-ab2a-4b0c-a74a-4411309fc25d/399336685_7545851028776543_1508813008164615625_n.jpg";

function buildImageGenerationContent(promptText) {
  return [
    {
      type: "text",
      text: `${promptText} Use the attached reference image only for visual style (brushwork, color palette, lighting, painterly feel)—do not copy its subject or composition.`,
    },
    {
      type: "image_url",
      imageUrl: { url: REFERENCE_IMAGE_URL },
    },
  ];
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
    request: summarizePayload({ prompt, referenceImage: true }),
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
            content: buildImageGenerationContent(fullPrompt),
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
