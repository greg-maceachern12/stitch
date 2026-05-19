import { ApiError } from "./errors";
import { logApiCall, summarizePayload, truncate } from "./logger";

const PLACEHOLDER_IMAGE =
  "https://cdn.iconscout.com/icon/free/png-256/free-error-2653315-2202987.png";

const IMAGE_STYLE_SUFFIX =
  ", cinematic painted illustration, oil painting, visible brushstrokes, dramatic cinematic lighting, rich color palette, widescreen composition, atmospheric depth, painterly, film still";

export async function generateImage(prompt, cheapModel = false) {
  if (!prompt || typeof prompt !== "string") {
    throw new ApiError("prompt is required", 400);
  }

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("Replicate predictions", { mock: true }).finish();
    return [PLACEHOLDER_IMAGE];
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    throw new ApiError(
      "Image generation not configured. Set REPLICATE_API_TOKEN or API_USE_MOCKS=true.",
      501
    );
  }

  const model = cheapModel
    ? process.env.REPLICATE_CHEAP_MODEL || "black-forest-labs/flux-schnell"
    : process.env.REPLICATE_MODEL || "black-forest-labs/flux-schnell";

  const log = logApiCall("Replicate predictions", {
    provider: "replicate",
    model,
    cheapModel,
    request: summarizePayload({ prompt }),
  });

  let response;
  try {
    response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${replicateToken}`,
        "Content-Type": "application/json",
        Prefer: "wait",
      },
      body: JSON.stringify({
        version: model,
        input: {
          prompt: `${prompt.trim()}${IMAGE_STYLE_SUFFIX}`,
          num_outputs: 1,
          aspect_ratio: "16:9",
          google_search: true,
          output_format: "jpg",
          output_quality: 100,
        },
      }),
    });
  } catch (error) {
    log.fail(error);
    throw error;
  }

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    log.fail(new ApiError("Replicate API request failed", response.status), {
      status: response.status,
      response: truncate(errorBody, 200),
    });
    throw new ApiError("Replicate API request failed", response.status);
  }

  const data = await response.json();
  const output = data.output;

  if (Array.isArray(output) && output[0]) {
    log.finish({ status: response.status, images: output.length });
    return output;
  }
  if (typeof output === "string") {
    log.finish({ status: response.status, images: 1 });
    return [output];
  }

  log.fail(new ApiError("No image URL returned from provider", 502), {
    status: 502,
  });
  throw new ApiError("No image URL returned from provider", 502);
}
