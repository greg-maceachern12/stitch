import { BookMarked, Cpu, Layers } from "lucide-react";

/**
 * Single source of truth for the Visuai Pro feature set.
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
      "Spoiler-free recap, character portraits, and key places before chapter one.",
    detail: {
      eyebrow: "Visuai Pro",
      tagline:
        "Open any book to a visual briefing — who's who, where you are, and what's happened so far — without a single spoiler.",
      intro:
        "Story Atlas reads the book the way a careful editor would, then hands you an illustrated orientation page before you turn to chapter one. It's built for the reader picking a series back up after months away, or anyone who wants faces and places anchored before the plot starts moving.",
      sections: [
        {
          heading: "Portraits for the cast that matters",
          body: "Visuai identifies the principal characters and renders a consistent portrait for each, drawn from the way the author actually describes them on the page. Names finally come with a face, so you stop flipping back to remember who betrayed whom.",
        },
        {
          heading: "A map of the places you'll go",
          body: "Cities, keeps, ships, and planets get their own establishing illustrations, grouped so you can see how the world fits together before you're dropped into it.",
        },
        {
          heading: "A recap that never spoils",
          body: "For later books in a series, the Atlas summarizes everything up to your starting point and nothing past it. The recap is generated only from text you've already been cleared to see, so the next twist stays a twist.",
        },
      ],
      highlights: [
        "Lore-accurate character portraits pulled straight from the prose",
        "Establishing art for the key locations in the book",
        "Spoiler-bounded recap for picking up a series mid-stream",
      ],
    },
  },
  {
    id: "in-chapter",
    slug: "in-chapter-art",
    icon: Layers,
    title: "In-chapter art",
    description: "Illustrations placed beside the passages they belong to.",
    detail: {
      eyebrow: "Visuai Pro",
      tagline:
        "Images land exactly where the moment happens — inline with the paragraph that earned them, not stranded at the top of a chapter.",
      intro:
        "The free preview gives you one image per chapter. In-chapter art breaks the chapter into its real beats and illustrates the moments that carry weight, then sets each image beside the passage it depicts so the reading rhythm never breaks.",
      sections: [
        {
          heading: "Scene-aware placement",
          body: "Visuai scans the chapter for the passages with the most visual payload — an arrival, a reveal, a battle — and anchors an illustration to each one. The picture shows up as you read into the moment, not before it.",
        },
        {
          heading: "Tuned to the page, not the chapter",
          body: "Longer, denser chapters earn more illustrations; quiet connective scenes earn fewer. The density follows the story instead of a fixed quota.",
        },
        {
          heading: "Reads like a real illustrated edition",
          body: "Images are sized and positioned to flow with the text in the exported EPUB, so the result feels like a printed illustrated edition rather than a gallery bolted onto the file.",
        },
      ],
      highlights: [
        "Multiple illustrations per chapter, placed inline",
        "Art anchored to the specific passage it depicts",
        "Image density that scales with each chapter",
      ],
    },
  },
  {
    id: "custom-models",
    slug: "custom-models",
    icon: Cpu,
    title: "Custom models",
    description:
      "Grok, Flux, Seedream, Gemini, and more — your pick per book.",
    detail: {
      eyebrow: "Visuai Pro",
      tagline:
        "Choose the image model that fits the book — gritty, painterly, photoreal, or stylized — and switch it per title.",
      intro:
        "Different books want different looks. Custom models let you pick the engine behind your illustrations, so a noir thriller and a high-fantasy epic don't have to share the same house style. Set it once per book and every illustration follows.",
      sections: [
        {
          heading: "A roster of image engines",
          body: "Grok, Flux, Seedream, Gemini, and more are available to choose from, each with its own strengths in composition, lighting, and texture. You pick the one that matches the mood you're after.",
        },
        {
          heading: "Per-book selection",
          body: "Your model choice is scoped to the book you're working on, so you can render one library in cinematic concept art and another in soft watercolor without resetting anything.",
        },
        {
          heading: "Room to grow",
          body: "New models land in the picker as they're added, so your options keep expanding without changing how you work.",
        },
      ],
      highlights: [
        "Choose from Grok, Flux, Seedream, Gemini, and more",
        "Model choice scoped per book",
        "New engines added to the picker over time",
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
