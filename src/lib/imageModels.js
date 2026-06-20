import { formatPerImageCost, getImageCostUsd } from "@/lib/imageModelPricing";

/** Default OpenRouter image model (Riverflow 2.5). */
export const DEFAULT_IMAGE_MODEL = "sourceful/riverflow-v2.5-fast";

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
  "google/gemini-3.1-flash-image-preview": {
    label: "Nano Banana",
    logoUrl: "/model-logos/google.png",
  },
  "openai/gpt-5.4-image-2": {
    label: "ChatGPT Image",
    logoUrl: "/model-logos/openai.png",
  },
  "sourceful/riverflow-v2.5-fast": {
    label: "Riverflow 2.5",
    logoUrl: "/model-logos/sourceful.png",
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

/** Resolve a user-selected model id; invalid/missing values fall back to Riverflow 2.5. */
export function resolveImageModel(requestedModel) {
  return getImageModel(requestedModel).id;
}
