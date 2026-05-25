export const DEFAULT_IMAGE_STYLE = "oil-painting";

/** @type {Record<string, { label: string; previewImageUrl?: string; referenceImageUrl?: string; promptSuffix: string; promptStyleGuide: string; referenceInstruction?: string }>} */
export const IMAGE_STYLES = {
  "oil-painting": {
    label: "Oil painting",
    referenceImageUrl: "/style-refs/oil-painting.jpg",
    promptSuffix:
      ", cinematic painted illustration, oil painting, visible brushstrokes, dramatic cinematic lighting, rich color palette, widescreen composition, atmospheric depth, painterly, film still",
    promptStyleGuide:
      "cinematic oil or gouache painting with visible brushwork, dramatic lighting, rich color grading, widescreen composition, and atmospheric depth—like a painted film still",
    referenceInstruction:
      "Use the attached reference image only for visual style (brushwork, color palette, lighting, painterly feel)—do not copy its subject or composition.",
  },
  watercolor: {
    label: "Watercolor",
    referenceImageUrl: "/style-refs/watercolor.png",
    promptSuffix:
      ", soft watercolor illustration, translucent washes, paper texture, gentle edges, muted palette, storybook illustration",
    promptStyleGuide:
      "soft watercolor illustration with translucent washes, visible paper texture, gentle edges, and a muted storybook palette",
    referenceInstruction:
      "Use the attached reference image only for visual style (wash technique, color palette, paper texture, soft edges)—do not copy its subject or composition.",
  },
  anime: {
    label: "Anime",
    referenceImageUrl: "/style-refs/anime.jpg",
    promptSuffix:
      ", anime illustration style, clean cel shading, vibrant colors, cinematic composition, detailed backgrounds",
    promptStyleGuide:
      "anime illustration with clean cel shading, vibrant colors, expressive lighting, and detailed cinematic backgrounds",
    referenceInstruction:
      "Use the attached reference image only for visual style (line work, cel shading, color palette, lighting)—do not copy its subject or composition.",
  },
  photoreal: {
    label: "Photoreal",
    referenceImageUrl: "/style-refs/photoreal.jpg",
    promptSuffix:
      ", photorealistic cinematic still, natural lighting, shallow depth of field, film photography, high detail",
    promptStyleGuide:
      "photorealistic cinematic still with natural lighting, shallow depth of field, film photography texture, and high detail",
    referenceInstruction:
      "Use the attached reference image only for visual style (lighting, texture, color grading, photographic realism)—do not copy its subject or composition.",
  },
};

export const IMAGE_STYLE_OPTIONS = Object.entries(IMAGE_STYLES).map(
  ([id, style]) => ({
    id,
    label: style.label,
    previewImageUrl: style.previewImageUrl ?? style.referenceImageUrl,
  })
);

export function isValidImageStyle(styleId) {
  return typeof styleId === "string" && styleId in IMAGE_STYLES;
}

export function getImageStyle(styleId) {
  const id = isValidImageStyle(styleId) ? styleId : DEFAULT_IMAGE_STYLE;
  return { id, ...IMAGE_STYLES[id] };
}

/** Absolute URL for a style reference (display / legacy). Image generation inlines local files via `resolveStyleReferenceForApi`. */
export function resolveStyleReferenceUrl(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  if (pathOrUrl.startsWith("/")) {
    const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
    if (base) {
      return `${base}${pathOrUrl}`;
    }
  }
  return pathOrUrl;
}
