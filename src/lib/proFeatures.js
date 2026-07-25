import { BookMarked, Cpu, Layers } from "lucide-react";

/**
 * Single source of truth for the Stitch Pro feature set.
 *
 * `id`/`icon`/`title`/`description` drive the compact feature rows in the Pro
 * modal. `slug` plus the `detail` block power the standalone deep-dive pages at
 * `/pro/[slug]`, so the modal and the marketing pages never drift apart.
 */
export const PRO_FEATURES = [
  {
    id: "story-atlas",
    slug: "story-atlas",
    icon: BookMarked,
    title: "Story Atlas",
    description:
      "Character portraits, key places, and a spoiler-free recap before chapter one.",
    detail: {
      eyebrow: "Stitch Pro",
      tagline:
        "Before chapter one, you get a visual briefing: who matters, where you are, and what already happened. Nothing from later in the book.",
      intro:
        "Story Atlas builds an illustrated orientation page from the book itself and puts it in front of chapter one. Handy if you're returning to a series after months away, or if you just want faces and places locked in before the plot starts moving.",
      sections: [
        {
          heading: "Portraits that stick",
          body: "Stitch pulls the main cast from how the author actually describes them, and draws a consistent portrait for each. Names come with faces, so you stop flipping back to remember who did what.",
          image: {
            src: "/pro/story-atlas-characters.webp",
            alt: "Story Atlas character portraits with names and short descriptions",
            width: 364,
            height: 600,
          },
        },
        {
          heading: "Places before you're dropped in",
          body: "Cities, keeps, ships, planets — the locations that matter get establishing art, grouped so the world makes sense before the story throws you into it.",
        },
        {
          heading: "A recap that stops where you start",
          body: "For later books in a series, the Atlas only summarizes up to your starting point. It never reads ahead, so the next twist stays a twist.",
          image: {
            src: "/pro/story-atlas-recap.webp",
            alt: "Story Atlas recap page for Death's End with a spoiler-free Previously section",
            width: 600,
            height: 573,
          },
        },
      ],
      highlights: [
        "Portraits grounded in the prose",
        "Establishing art for key locations",
        "A recap that won't spoil what comes next",
      ],
    },
  },
  {
    id: "in-chapter",
    slug: "in-chapter-art",
    icon: Layers,
    title: "In-chapter art",
    description:
      "Extra illustrations, sitting next to the passages they belong to.",
    detail: {
      eyebrow: "Stitch Pro",
      tagline:
        "The picture shows up where the moment happens — next to that paragraph, not parked at the top of the chapter.",
      intro:
        "Free preview gives you one image per chapter. In-chapter art finds the beats that actually deserve a picture, then drops each one beside the passage it depicts so reading doesn't feel interrupted.",
      sections: [
        {
          heading: "Placed on the scene, not the chapter header",
          body: "Stitch looks for the moments with something to show — an arrival, a reveal, a fight — and anchors an illustration there. You see it as you read into it, not before.",
          image: {
            src: "/pro/in-chapter-art.webp",
            alt: "In-chapter illustration placed above the passage it depicts, with caption and body text below",
            width: 600,
            height: 590,
          },
        },
        {
          heading: "Density follows the story",
          body: "Dense chapters get more art. Quieter connective scenes get less. No fixed quota per chapter.",
        },
        {
          heading: "Built for the EPUB, not a gallery dump",
          body: "Images are sized to sit in the text flow of the exported file. Closer to a printed illustrated edition than a slideshow stapled on afterward.",
        },
      ],
      highlights: [
        "Several illustrations per chapter, inline",
        "Each one tied to a specific passage",
        "More art where the chapter earns it",
      ],
    },
  },
  {
    id: "custom-models",
    slug: "custom-models",
    icon: Cpu,
    title: "Custom models",
    description:
      "Pick the image model per book — Grok, Flux, Seedream, Gemini, and more.",
    detail: {
      eyebrow: "Stitch Pro",
      tagline:
        "Pick the look that fits the book — gritty, painterly, photoreal, stylized — and change it per title.",
      intro:
        "A noir thriller and a high-fantasy epic shouldn't have to share one house style. Custom models let you choose the engine behind the illustrations for that book. Set it once; every image follows.",
      sections: [
        {
          heading: "The models you can pick",
          body: "Grok, Flux, Seedream, Gemini, and others are in the picker. They differ in lighting, texture, and how they handle composition. Choose the one that matches the mood you want.",
        },
        {
          heading: "One choice per book",
          body: "Model choice stays with the book you're working on. Run one title in cinematic concept art and another in soft watercolor without resetting anything.",
        },
        {
          heading: "New models show up in the same place",
          body: "When we add engines, they land in the picker. Same workflow, bigger menu.",
        },
      ],
      highlights: [
        "Grok, Flux, Seedream, Gemini, and more",
        "Model choice scoped per book",
        "New engines added to the picker as they land",
      ],
    },
  },
];

export function getProFeature(slug) {
  return PRO_FEATURES.find((feature) => feature.slug === slug) ?? null;
}

export function getProFeatureSlugs() {
  return PRO_FEATURES.map((feature) => feature.slug);
}
