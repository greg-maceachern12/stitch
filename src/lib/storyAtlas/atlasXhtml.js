import { escapeXml } from "@/lib/epub/xhtml";

function paragraph(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  return `<p>${escapeXml(trimmed)}</p>`;
}

function characterCard(character) {
  const imageBlock = character.imagePath
    ? `<figure class="atlas-character__figure">
        <img class="atlas-character__image" src="${escapeXml(character.imagePath)}" alt="${escapeXml(character.name)}"/>
      </figure>`
    : "";

  return `<article class="atlas-character">
    ${imageBlock}
    <h3 class="atlas-character__name">${escapeXml(character.name)}</h3>
    <div class="atlas-character__about">
      ${paragraph(character.description)}
    </div>
  </article>`;
}

function locationItem(location) {
  return `<li class="atlas-location">
    <h3 class="atlas-location__name">${escapeXml(location.name)}</h3>
    ${paragraph(location.meaning)}
  </li>`;
}

/**
 * @param {{ recap?: { text?: string }, characters: object[], locations: object[] }} plan
 * @param {string} bookTitle
 */
export function buildStoryAtlasXhtml(plan, bookTitle) {
  const recapText = plan.recap?.text?.trim();
  const recapSection = recapText
    ? `<section class="atlas-section atlas-recap" aria-labelledby="atlas-recap-heading">
        <h2 id="atlas-recap-heading" class="atlas-section__title">Previously</h2>
        <div class="atlas-recap__callout">
          ${paragraph(recapText)}
        </div>
      </section>`
    : "";

  const characters = (plan.characters ?? [])
    .map((character) =>
      characterCard({
        ...character,
        imagePath: character.imagePath ?? null,
      })
    )
    .join("\n");

  const characterSection = characters
    ? `<section class="atlas-section atlas-characters" aria-labelledby="atlas-characters-heading">
        <h2 id="atlas-characters-heading" class="atlas-section__title">Characters</h2>
        <div class="atlas-character-list">
          ${characters}
        </div>
      </section>`
    : "";

  const locations = (plan.locations ?? []).map(locationItem).join("\n");
  const locationSection = locations
    ? `<section class="atlas-section atlas-locations" aria-labelledby="atlas-locations-heading">
        <h2 id="atlas-locations-heading" class="atlas-section__title">Places</h2>
        <ul class="atlas-location-list">
          ${locations}
        </ul>
      </section>`
    : "";

  const body = [recapSection, characterSection, locationSection]
    .filter(Boolean)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" lang="en">
<head>
  <title>Story Atlas</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body class="story-atlas">
  <header class="atlas-header">
    <p class="atlas-brand">Stitch Story Atlas</p>
    <h1 class="atlas-title">${escapeXml(bookTitle)}</h1>
    <p class="atlas-tagline">Your spoiler-free guide before you begin</p>
  </header>
  ${body}
</body>
</html>`;
}
