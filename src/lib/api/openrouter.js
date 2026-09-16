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

const OPENROUTER_IMAGES_URL = "https://openrouter.ai/api/v1/images";

function getOpenRouterApiKey() {
  return openRouterApiKeyStore.getStore() || process.env.OPENROUTER_API_KEY;
}

export function requireOpenRouterApiKey(routeLabel) {
  const apiKey = getOpenRouterApiKey();
  if (!apiKey) {
    throw new ApiError(
      `${routeLabel} not configured. Add an OpenRouter API key in Options, or set OPENROUTER_API_KEY in .env.local.`,
      501
    );
  }
  return apiKey;
}

/**
 * Dedicated Image API (`POST /api/v1/images`). All Stitch image models go
 * through this endpoint — not chat/completions.
 */
export async function generateOpenRouterImage({
  model,
  prompt,
  aspectRatio,
  inputReferences,
}) {
  const apiKey = requireOpenRouterApiKey("Image generation route");
  const body = {
    model,
    prompt,
    aspect_ratio: aspectRatio,
  };
  if (Array.isArray(inputReferences) && inputReferences.length > 0) {
    body.input_references = inputReferences;
  }

  const response = await fetch(OPENROUTER_IMAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      `OpenRouter images failed: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.body = payload;
    throw error;
  }

  return payload;
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
  return new OpenRouter({ apiKey: requireOpenRouterApiKey(routeLabel) });
}
