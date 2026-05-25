/**
 * Approximate OpenRouter cost per generated chapter image at default settings
 * (16:9, smallest size tier for each model). Sources: openrouter.ai model pages,
 * Google Gemini image token docs (1290 output tokens ≈ $0.039).
 *
 * @typedef {"per_image" | "per_megapixel" | "per_output_tokens"} PricingKind
 */

/** @type {Record<string, { kind: PricingKind, usd: number, note?: string }>} */
export const IMAGE_MODEL_COST_USD = {
  "x-ai/grok-imagine-image-quality": {
    kind: "per_image",
    usd: 0.05,
    note: "OpenRouter: from $0.05/image at 1K",
  },
  "bytedance-seed/seedream-4.5": {
    kind: "per_image",
    usd: 0.04,
    note: "OpenRouter: $0.04/image",
  },
  "black-forest-labs/flux.2-klein-4b": {
    kind: "per_megapixel",
    usd: 0.014,
    note: "OpenRouter: $0.014 for the first output megapixel at 1K",
  },
  "google/gemini-2.5-flash-image": {
    kind: "per_output_tokens",
    usd: 0.039,
    note: "≈1290 image output tokens at $2.50/M",
  },
  "openai/gpt-5-image-mini": {
    kind: "per_image",
    usd: 0.011,
    note: "≈GPT Image 1 Mini medium 1K; token pricing varies",
  },
};

/** 16:9 at 1K — used for megapixel-based models (Flux). */
const FLUX_1K_16_9_MEGAPIXELS = (1024 * 576) / 1_000_000;

const DEFAULT_PRICED_MODEL = "x-ai/grok-imagine-image-quality";

export function getImageCostUsd(modelId) {
  const entry =
    IMAGE_MODEL_COST_USD[modelId] ?? IMAGE_MODEL_COST_USD[DEFAULT_PRICED_MODEL];
  if (entry.kind === "per_megapixel") {
    const mp = FLUX_1K_16_9_MEGAPIXELS;
    return entry.usd * Math.max(1, Math.ceil(mp));
  }
  return entry.usd;
}

export function formatUsd(amount) {
  if (amount < 0.01) {
    return `$${amount.toFixed(3)}`;
  }
  if (amount < 1) {
    return `$${amount.toFixed(2)}`;
  }
  return `$${amount.toFixed(2)}`;
}

export function formatPerImageCost(modelId) {
  return `~${formatUsd(getImageCostUsd(modelId))}/img`;
}

export function estimateIllustrationCostUsd(modelId, imageCount) {
  const images = Math.max(0, Number(imageCount) || 0);
  return getImageCostUsd(modelId) * images;
}

export function formatIllustrationCostEstimate(modelId, imageCount) {
  const perImage = getImageCostUsd(modelId);
  const total = estimateIllustrationCostUsd(modelId, imageCount);
  const images = Math.max(0, Number(imageCount) || 0);

  if (images === 0) {
    return `~${formatUsd(perImage)} per illustration`;
  }

  const imageLabel = images === 1 ? "1 image" : `up to ${images} images`;
  return `~${formatUsd(total)} for ${imageLabel} (~${formatUsd(perImage)} each)`;
}

/** Total illustration price for display (e.g. "$0.55"). Returns null when imageCount is 0. */
export function formatIllustrationPrice(modelId, imageCount) {
  const images = Math.max(0, Number(imageCount) || 0);
  if (images === 0) return null;
  return formatUsd(estimateIllustrationCostUsd(modelId, imageCount));
}
