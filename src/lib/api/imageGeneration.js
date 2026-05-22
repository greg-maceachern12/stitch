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

function buildImageGenerationContent(promptText, style) {
  const content = [{ type: "text", text: promptText }];

  const referenceUrl = resolveStyleReferenceUrl(style.referenceImageUrl);
  if (referenceUrl && style.referenceInstruction) {
    content[0].text = `${promptText} ${style.referenceInstruction}`;
    content.push({
      type: "image_url",
      imageUrl: { url: referenceUrl },
    });
  }

  return content;
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

  const log = logApiCall("OpenRouter image", {
    provider: "openrouter",
    model,
    imageStyle: style.id,
    imageModel: model,
    request: summarizePayload({
      prompt,
      imageStyle: style.id,
      imageModel: model,
      referenceImage: Boolean(style.referenceImageUrl),
    }),
  });

  try {
    const response = await client.chat.send({
      chatRequest: {
        model,
        stream: false,
        modalities: getImageGenerationModalities(model),
        messages: [
          {
            role: "user",
            content: buildImageGenerationContent(fullPrompt, style),
          },
        ],
        imageConfig: {
          aspect_ratio: "16:9",
          image_size: getImageSizeForModel(model),
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
