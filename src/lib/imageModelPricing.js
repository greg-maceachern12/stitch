/**
 * Approximate OpenRouter cost per generated chapter image at default settings
 * (16:9, provider default resolution). Sources: openrouter.ai model pages.
 *
 * @typedef {"per_image" | "per_megapixel" | "per_tokens"} PricingKind
 */

/** @param {number} tokens @param {number} usdPerMillion */
function tokensToUsd(tokens, usdPerMillion) {
  return (tokens / 1_000_000) * usdPerMillion;
}

/**
 * @param {{ inputTokens?: number, outputTokens?: number, imageOutputTokens?: number }} counts
 * @param {{ inputUsdPerM?: number, outputUsdPerM?: number, imageOutputUsdPerM?: number }} rates
 */
function computeTokenCostUsd(counts, rates) {
  const inputTokens = counts.inputTokens ?? 0;
  const outputTokens = counts.outputTokens ?? 0;
  const imageOutputTokens = counts.imageOutputTokens ?? 0;
  return (
    tokensToUsd(inputTokens, rates.inputUsdPerM ?? 0) +
    tokensToUsd(outputTokens, rates.outputUsdPerM ?? 0) +
    tokensToUsd(imageOutputTokens, rates.imageOutputUsdPerM ?? 0)
  );
}

/** @type {Record<string, { kind: PricingKind, usd?: number, note?: string } & Record<string, unknown>>} */
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
  "google/gemini-3.1-flash-image-preview": {
    kind: "per_tokens",
    inputUsdPerM: 0.5,
    imageOutputUsdPerM: 60,
    estimatedInputTokens: 1620,
    estimatedImageOutputTokens: 1056,
    note: "Default 1K (~1056 @ $60/M image out) + prompt/ref @ $0.50/M in",
  },
  "openai/gpt-5.4-image-2": {
    kind: "per_tokens",
    inputUsdPerM: 8,
    imageOutputUsdPerM: 30,
    estimatedInputTokens: 1500,
    estimatedImageOutputTokens: 1056,
    note: "1K medium (~1056 @ $30/M image out) + prompt/ref @ $8/M in",
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
  if (entry.kind === "per_tokens") {
    return computeTokenCostUsd(
      {
        inputTokens: entry.estimatedInputTokens,
        outputTokens: entry.estimatedOutputTokens,
        imageOutputTokens: entry.estimatedImageOutputTokens,
      },
      {
        inputUsdPerM: entry.inputUsdPerM,
        outputUsdPerM: entry.outputUsdPerM,
        imageOutputUsdPerM: entry.imageOutputUsdPerM,
      }
    );
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
