import { getImageStyle } from "@/lib/imageStyles";
import {
  MAX_ATLAS_CHARACTERS,
  MAX_ATLAS_LOCATIONS,
} from "@/lib/storyAtlas/constants";
import { ApiError } from "./errors";
import { logApiCall, summarizePayload } from "./logger";
import { getOpenRouterTextModel, requireOpenRouterClient } from "./openrouter";
import { researchStoryAtlasContext } from "./storyAtlasResearch";
import { mockStoryAtlasPlan, normalizeStoryAtlasPlan } from "./storyAtlasSchema";

function buildSystemPrompt(promptStyleGuide, maxCharacters, maxLocations) {
  return `You are building a "Story Atlas" front matter page for an illustrated EPUB.

Return only valid JSON with this shape:
{
  "recap": { "text": string, "confidence": "high" | "low" | "none" },
  "characters": [{ "id": string, "name": string, "description": string, "visualBrief": string }],
  "locations": [{ "id": string, "name": string, "meaning": string }]
}

Rules:
- Use only public knowledge about the published book and series (and any research notes provided).
- Do NOT use or assume access to private manuscript text. None is provided.
- SPOILERS: Include only information safe before the reader starts THIS book. Do not reveal twists, deaths, or revelations from this volume.
- RECAP: If this is clearly book 2+ in a known series, write recap.text (80-120 words) summarizing prior book(s). If book 1, standalone, or uncertain, set recap.text to "" and recap.confidence to "none".
- CHARACTERS: Up to ${maxCharacters} important figures at the story's start. description: 1-2 spoiler-free sentences for readers. visualBrief: concrete appearance for an illustrator (no plot spoilers).
- LOCATIONS: Up to ${maxLocations} important places. meaning: 1-2 spoiler-free sentences. No images for locations.
- ids: lowercase slug from name.
- Portrait style guidance for visualBrief wording: ${promptStyleGuide}`;
}

function buildUserMessage(identity, researchDigest) {
  const lines = [
    `Book: ${identity.bookTitle}`,
    `Author: ${identity.author || "Unknown"}`,
  ];

  if (identity.seriesName) {
    lines.push(`Series: ${identity.seriesName}`);
  }
  if (identity.seriesIndex) {
    lines.push(`Series index: ${identity.seriesIndex}`);
    if (identity.seriesIndex > 1) {
      lines.push(
        "This appears to be a later volume. Recap prior book(s) in recap.text when confident."
      );
    }
  }

  lines.push(
    "",
    "Research notes (public web summaries; may be incomplete):",
    researchDigest?.trim() ? researchDigest.trim() : "None available.",
    "",
    "Produce the Story Atlas JSON."
  );

  return lines.join("\n");
}

export async function generateStoryAtlasPlan({
  bookTitle,
  author,
  seriesName,
  seriesIndex,
  imageStyle,
  maxCharacters = MAX_ATLAS_CHARACTERS,
  maxLocations = MAX_ATLAS_LOCATIONS,
}) {
  if (!bookTitle || typeof bookTitle !== "string") {
    throw new ApiError("bookTitle is required", 400);
  }

  const identity = {
    bookTitle: bookTitle.trim(),
    author: author?.trim() || "Unknown",
    seriesName: seriesName?.trim() || null,
    seriesIndex: Number.isFinite(seriesIndex) ? seriesIndex : null,
  };

  const style = getImageStyle(imageStyle);

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("OpenRouter story atlas plan", { mock: true }).finish();
    return mockStoryAtlasPlan();
  }

  const research = await researchStoryAtlasContext(identity);
  const model = getOpenRouterTextModel();
  const log = logApiCall("OpenRouter story atlas plan", {
    provider: "openrouter",
    model,
    request: summarizePayload({
      bookTitle: identity.bookTitle,
      seriesIndex: identity.seriesIndex,
      researchSources: research.sources?.length ?? 0,
    }),
  });

  const client = requireOpenRouterClient("Story Atlas plan");

  try {
    const response = await client.chat.send({
      chatRequest: {
        model,
        messages: [
          {
            role: "system",
            content: buildSystemPrompt(
              style.promptStyleGuide,
              maxCharacters,
              maxLocations
            ),
          },
          {
            role: "user",
            content: buildUserMessage(identity, research.digest),
          },
        ],
      },
    });

    const content = response.choices[0]?.message?.content ?? "";
    const plan = normalizeStoryAtlasPlan(content, { maxCharacters, maxLocations });

    if (!plan) {
      log.fail(new ApiError("Could not parse Story Atlas plan", 502));
      throw new ApiError("Could not parse Story Atlas plan", 502);
    }

    log.finish({
      characters: plan.characters.length,
      locations: plan.locations.length,
      recap: plan.recap.confidence,
    });

    return plan;
  } catch (error) {
    if (!(error instanceof ApiError)) {
      log.fail(error);
    }
    throw error;
  }
}
