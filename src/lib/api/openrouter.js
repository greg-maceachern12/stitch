import { OpenRouter } from "@openrouter/sdk";
import { ApiError } from "./errors";

/** Gemini chat model for prompt / text generation */
export const DEFAULT_TEXT_MODEL = "google/gemini-2.5-flash";

/** Gemini image model (primary quality) */
export const DEFAULT_IMAGE_MODEL = "google/gemini-2.5-flash-image";

/** Faster / cheaper Gemini image model */
export const DEFAULT_IMAGE_CHEAP_MODEL = "google/gemini-2.5-flash-image";

export function getOpenRouterTextModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_TEXT_MODEL;
}

export function getOpenRouterImageModel(cheapModel = false) {
  if (cheapModel) {
    return (
      process.env.OPENROUTER_IMAGE_CHEAP_MODEL ||
      process.env.OPENROUTER_IMAGE_MODEL ||
      DEFAULT_IMAGE_CHEAP_MODEL
    );
  }
  return process.env.OPENROUTER_IMAGE_MODEL || DEFAULT_IMAGE_MODEL;
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
