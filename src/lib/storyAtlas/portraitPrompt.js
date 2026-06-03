import { getImageStyle } from "@/lib/imageStyles";

export function buildCharacterPortraitPrompt(name, visualBrief, imageStyle) {
  const style = getImageStyle(imageStyle);
  const brief = String(visualBrief || "").trim();
  const subject = String(name || "Character").trim();

  return [
    `Portrait of ${subject}.`,
    brief,
    style.promptStyleGuide,
    "Bust or shoulders, neutral background, centered composition.",
    "Character reference for a story atlas front matter page.",
    "No text, watermark, or caption in the image.",
    "Clear facial features are allowed and encouraged.",
  ]
    .filter(Boolean)
    .join(" ");
}
