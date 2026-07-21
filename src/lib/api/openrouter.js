import { AsyncLocalStorage } from "node:async_hooks";
import { OpenRouter } from "@openrouter/sdk";
import { DEFAULT_IMAGE_MODEL, getImageModel } from "@/lib/imageModels";
import { ApiError } from "./errors";

/** Gemini chat model for prompt generation (lighter / cheaper). */
export const PROMPT_GENERATION_MODEL = "google/gemini-3.5-flash-lite";

/** Gemini chat model for Story Atlas and section art selection. */
export const ATLAS_SECTION_TEXT_MODEL = "google/gemini-3.6-flash";

export { DEFAULT_IMAGE_MODEL };

/** Request-scoped OpenRouter key from the client (BYOK). */
const openRouterApiKeyStore = new AsyncLocalStorage();

export function normalizeOpenRouterApiKey(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

/** Run an API handler with an optional per-request OpenRouter API key. */
export function runWithOpenRouterApiKey(apiKey, fn) {
  return openRouterApiKeyStore.run(normalizeOpenRouterApiKey(apiKey), fn);
}

/** Modalities required by the image model (Grok/Seedream/Krea/Sourceful are image-only; most others also return text). */
export function getImageGenerationModalities(model) {
  if (
    model.startsWith("x-ai/grok-imagine") ||
    model.startsWith("bytedance-seed/seedream") ||
    model.startsWith("krea/") ||
    model.startsWith("sourceful/riverflow")
  ) {
    return ["image"];
  }
  return ["image", "text"];
}

export function getOpenRouterTextModel() {
  return process.env.OPENROUTER_MODEL || PROMPT_GENERATION_MODEL;
}

/** Story Atlas plan generation — always Gemini 3.6 Flash (not OPENROUTER_MODEL). */
export function getStoryAtlasTextModel() {
  return ATLAS_SECTION_TEXT_MODEL;
}

/** Section art selection — always Gemini 3.6 Flash (1M context, not OPENROUTER_MODEL). */
export function getSectionSelectionModel() {
  return ATLAS_SECTION_TEXT_MODEL;
}

export function getOpenRouterImageModel(requestedModel) {
  return getImageModel(requestedModel).id;
}

export function requireOpenRouterClient(routeLabel) {
  const apiKey =
    openRouterApiKeyStore.getStore() || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ApiError(
      `${routeLabel} not configured. Add an OpenRouter API key in Options, or set OPENROUTER_API_KEY in .env.local.`,
      501
    );
  }
  return new OpenRouter({ apiKey });
}
