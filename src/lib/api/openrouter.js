import { OpenRouter } from "@openrouter/sdk";
import { DEFAULT_IMAGE_MODEL, getImageModel } from "@/lib/imageModels";
import { ApiError } from "./errors";

/** Gemini chat model for prompt / text generation */
export const DEFAULT_TEXT_MODEL = "google/gemini-3.5-flash";

export { DEFAULT_IMAGE_MODEL };

/** Modalities required by the image model (Grok/Sourceful are image-only; most others also return text). */
export function getImageGenerationModalities(model) {
  if (
    model.startsWith("x-ai/grok-imagine") ||
    model.startsWith("sourceful/riverflow")
  ) {
    return ["image"];
  }
  return ["image", "text"];
}

export function getOpenRouterTextModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_TEXT_MODEL;
}

/** Story Atlas plan generation — always Gemini 3.5 Flash (not OPENROUTER_MODEL). */
export function getStoryAtlasTextModel() {
  return DEFAULT_TEXT_MODEL;
}

/** Section art selection — always Gemini 3.5 Flash (1M context, not OPENROUTER_MODEL). */
export function getSectionSelectionModel() {
  return DEFAULT_TEXT_MODEL;
}

export function getOpenRouterImageModel(requestedModel) {
  return getImageModel(requestedModel).id;
}

export function requireOpenRouterClient(routeLabel) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ApiError(
      `${routeLabel} not configured. Add OPENROUTER_API_KEY to .env.local or set API_USE_MOCKS=true.`,
      501
    );
  }
  return new OpenRouter({ apiKey });
}
