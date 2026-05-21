import { ApiError } from "./errors";
import { logApiCall, summarizePayload } from "./logger";
import {
  getOpenRouterVideoModel,
  requireOpenRouterClient,
} from "./openrouter";

const PLACEHOLDER_VIDEO =
  "https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4";

const POLL_INTERVAL_MS = 5000;
const MAX_POLL_ATTEMPTS = 120;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate a video via OpenRouter (Google Veo). Polls until complete.
 * Returns an array with one video URL (matches image API shape).
 */
export async function generateVideo(prompt, options = {}) {
  if (!prompt || typeof prompt !== "string") {
    throw new ApiError("prompt is required", 400);
  }

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("OpenRouter video", { mock: true }).finish();
    return [PLACEHOLDER_VIDEO];
  }

  const model = getOpenRouterVideoModel();
  const client = requireOpenRouterClient("Video generation route");
  const log = logApiCall("OpenRouter video", {
    provider: "openrouter",
    model,
    request: summarizePayload({ prompt }),
  });

  try {
    const job = await client.videoGeneration.generate({
      videoGenerationRequest: {
        model,
        prompt: prompt.trim(),
        aspectRatio: options.aspectRatio || "16:9",
        resolution: options.resolution || "720p",
        duration: options.duration,
      },
    });

    const jobId = job.id;
    if (!jobId) {
      throw new ApiError("No video job id returned from provider", 502);
    }

    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      if (attempt > 0) {
        await sleep(POLL_INTERVAL_MS);
      }

      const status = await client.videoGeneration.getGeneration({ jobId });

      if (status.status === "completed") {
        const urls = status.unsignedUrls ?? status.unsigned_urls ?? [];
        if (urls.length > 0) {
          log.finish({ videos: urls.length });
          return urls;
        }
        throw new ApiError("Video completed but no download URL returned", 502);
      }

      if (status.status === "failed") {
        const message =
          status.error || "Video generation failed on provider";
        log.fail(new ApiError(message, 502));
        throw new ApiError(message, 502);
      }
    }

    throw new ApiError("Video generation timed out", 504);
  } catch (error) {
    if (!(error instanceof ApiError)) {
      log.fail(error);
    }
    throw error;
  }
}
