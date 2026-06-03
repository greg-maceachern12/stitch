import { getImageStyle } from "@/lib/imageStyles";
import {
  MAX_ATLAS_CHARACTERS,
  MAX_ATLAS_LOCATIONS,
} from "@/lib/storyAtlas/constants";
import { ApiError } from "./errors";
import { logApiCall, summarizePayload } from "./logger";
import { getStoryAtlasTextModel, requireOpenRouterClient } from "./openrouter";
import { researchStoryAtlasContext } from "./storyAtlasResearch";
import { mockStoryAtlasPlan, normalizeStoryAtlasPlan } from "./storyAtlasSchema";

function buildSystemPrompt(promptStyleGuide, maxCharacters, maxLocations) {
  return `You are a literary editor assembling a spoiler-free "Story Atlas" front matter page for an illustrated EPUB. It orients a reader BEFORE they begin THIS book: a short catch-up, a cast of faces, and a few key places.

OUTPUT
Return ONLY a single valid JSON object. No markdown, no code fences, no commentary before or after.
Shape:
{
  "recap": { "text": string, "confidence": "high" | "low" | "none" },
  "characters": [{ "id": string, "name": string, "description": string, "visualBrief": string }],
  "locations": [{ "id": string, "name": string, "meaning": string }]
}

SOURCES & HONESTY
- Use only public, widely-known information about the published book, its author, and its series, plus any research notes provided.
- You have NO access to the manuscript text. Never invent specifics. If you are unsure a book exists or cannot recall reliable details, prefer fewer entries over fabricated ones.
- Do not confuse this book with similarly titled works; if uncertain about identity, keep entries generic and lower confidence.

SPOILER SAFETY (most important)
- Include only what is safe to know at the OPENING of THIS book. Treat it like the back-cover copy, not a summary.
- Never reveal this book's twists, betrayals, romances, deaths, or late-act revelations. Describe who/what things are at the start, not what they become.
- Earlier books in the series may be summarized in the recap, since the reader has presumably read them.

RECAP
- Only write a recap if this is clearly book 2 or later in a series you can recall. Summarize the PRIOR volume(s) in 80-120 words, focusing on where things stand as this book opens.
- confidence "high" = confident recall of prior books; "low" = partial/uncertain recall; "none" = book 1, standalone, or unknown.
- If confidence is "none", set text to "".

CHARACTERS (up to ${maxCharacters})
- Choose the figures a reader most needs to recognize at the story's start; order by importance, protagonist first.
- description: 2-3 sentences, reader-facing copy shown in the book under their portrait. Cover who they are at the story's start: role, key relationships, temperament, and anything else a reader needs to recognize them early. Spoiler-free.
- visualBrief: this string is fed directly to an image generator to create a portrait, then a separate style + composition layer is appended. So write ONLY physical appearance as comma-separated descriptors: approximate age, gender presentation, skin tone, hair (color/length/style), eye color, build, distinctive features (scars, glasses, markings), typical attire, and a default expression. Stay faithful to canon when appearance is established; otherwise give a plausible, neutral description. Do NOT include style words, framing, "portrait", lighting, or background — those are added later. No plot spoilers in appearance.

LOCATIONS (up to ${maxLocations})
- Key places a reader should recognize at the start. Order by importance.
- meaning: 1-2 spoiler-free sentences on what the place is and why it matters early in the story. No images are generated for locations.

IDS
- id: lowercase, hyphenated slug derived from name (e.g. "Eleanor Vance" -> "eleanor-vance"). Unique within its list.

For context only (do NOT copy into visualBrief), the illustration style will be: ${promptStyleGuide}`;
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
  const model = getStoryAtlasTextModel();
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
