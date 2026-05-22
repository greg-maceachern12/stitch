import { OpenRouter } from "@openrouter/sdk";
import { DEFAULT_IMAGE_MODEL, resolveImageModel } from "@/lib/imageModels";
import { ApiError } from "./errors";

/** Gemini chat model for prompt / text generation */
export const DEFAULT_TEXT_MODEL = "google/gemini-3.5-flash";

export { DEFAULT_IMAGE_MODEL };

/** Modalities required by the image model (Grok is image-only; most others also return text). */
export function getImageGenerationModalities(model) {
  if (model.startsWith("x-ai/grok-imagine")) {
    return ["image"];
  }
  return ["image", "text"];
}

export function getOpenRouterTextModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_TEXT_MODEL;
}

export function getOpenRouterImageModel(requestedModel) {
  return resolveImageModel(requestedModel);
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
