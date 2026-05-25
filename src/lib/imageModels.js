import { formatPerImageCost, getImageCostUsd } from "@/lib/imageModelPricing";

/** Default OpenRouter image model (Grok). */
export const DEFAULT_IMAGE_MODEL = "x-ai/grok-imagine-image-quality";

/** Smallest resolution for most OpenRouter image models. */
export const DEFAULT_IMAGE_SIZE = "1K";

/** Models that support OpenRouter's 0.5K tier (lowest available). */
const HALF_K_MODELS = new Set(["google/gemini-3.1-flash-image-preview"]);

/** @type {Record<string, { label: string; logoUrl: string }>} */
export const IMAGE_MODELS = {
  "x-ai/grok-imagine-image-quality": {
    label: "Grok Image Quality",
    logoUrl: "/model-logos/grok.png",
  },
  "bytedance-seed/seedream-4.5": {
    label: "Seedream 4.5",
    logoUrl: "/model-logos/bytedance.png",
  },
  "black-forest-labs/flux.2-klein-4b": {
    label: "Flux 2 Klein",
    logoUrl: "/model-logos/flux.png",
  },
  "google/gemini-2.5-flash-image": {
    label: "Nano Banana",
    logoUrl: "/model-logos/google.png",
  },
  "openai/gpt-5-image-mini": {
    label: "ChatGPT Image",
    logoUrl: "/model-logos/openai.png",
  },
};

export const IMAGE_MODEL_OPTIONS = Object.entries(IMAGE_MODELS).map(
  ([id, model]) => ({
    id,
    label: model.label,
    logoUrl: model.logoUrl,
    costPerImageUsd: getImageCostUsd(id),
    costLabel: formatPerImageCost(id),
  })
);

export function isValidImageModel(modelId) {
  return typeof modelId === "string" && modelId in IMAGE_MODELS;
}

export function getImageModel(modelId) {
  const id = isValidImageModel(modelId) ? modelId : DEFAULT_IMAGE_MODEL;
  return { id, ...IMAGE_MODELS[id] };
}

/** Resolve a user-selected model id; invalid/missing values fall back to Grok. */
export function resolveImageModel(requestedModel) {
  return getImageModel(requestedModel).id;
}

export function getImageSizeForModel(modelId) {
  if (HALF_K_MODELS.has(modelId)) {
    return "0.5K";
  }
  return DEFAULT_IMAGE_SIZE;
}
