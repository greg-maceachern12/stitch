import { getImageStyle } from "@/lib/imageStyles";
import {
  buildFallbackSectionSelections,
  normalizeSectionSelections,
} from "@/lib/epub/sectionIllustrations";
import { ApiError } from "./errors";
import { logApiCall, summarizePayload, truncate } from "./logger";
import { getOpenRouterTextModel, requireOpenRouterClient } from "./openrouter";

function buildSystemPrompt(promptStyleGuide) {
  return `You choose the best in-chapter passages to illustrate for an EPUB.

Return only valid JSON. The JSON must be an array of objects with:
- anchorId: one of the provided anchor ids
- prompt: a complete image-generation prompt for that passage
- altText: concise image alt text
- caption: a short neutral caption

Choose visually specific scenes with concrete settings, objects, movement, atmosphere, or dramatic action.
Avoid passages that are mostly exposition, dialogue without visual context, copyright text, or chapter-title material.
Every prompt must describe the scene in this visual style: ${promptStyleGuide}
Prompts should focus on atmospheric elements, surroundings, objects, and composition. Do not focus on character faces.`;
}

function extractJsonArray(content) {
  const text = String(content || "").trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function sanitizeCandidates(candidates) {
  if (!Array.isArray(candidates)) return [];

  return candidates
    .filter(
      (candidate) =>
        typeof candidate?.anchorId === "string" &&
        typeof candidate?.excerpt === "string"
    )
    .map((candidate, index) => ({
      anchorId: candidate.anchorId,
      index: Number.isFinite(candidate.index) ? candidate.index : index,
      kind: candidate.kind || "p",
      excerpt: truncate(candidate.excerpt, 900),
    }));
}

export async function selectIllustrationSections({
  bookTitle,
  chapterTitle,
  imageStyle,
  targetCount,
  candidates,
}) {
  if (!chapterTitle || typeof chapterTitle !== "string") {
    throw new ApiError("chapterTitle is required", 400);
  }

  const style = getImageStyle(imageStyle);
  const cleanCandidates = sanitizeCandidates(candidates);
  const fallback = () =>
    buildFallbackSectionSelections({
      bookTitle,
      chapterTitle,
      imageStyle: style.label,
      candidates: cleanCandidates,
      targetCount,
    });

  if (cleanCandidates.length === 0 || Number(targetCount) <= 0) {
    return [];
  }

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("OpenRouter section selection", {
      mock: true,
      imageStyle: style.id,
    }).finish();
    return fallback();
  }

  const model = getOpenRouterTextModel();
  const log = logApiCall("OpenRouter section selection", {
    provider: "openrouter",
    model,
    imageStyle: style.id,
    request: summarizePayload({
      bookTitle,
      chapterTitle,
      imageStyle: style.id,
      targetCount,
      candidates: cleanCandidates.length,
    }),
  });

  const client = requireOpenRouterClient("Section selection");

  try {
    const response = await client.chat.send({
      chatRequest: {
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(style.promptStyleGuide) },
          {
            role: "user",
            content: JSON.stringify({
              bookTitle: bookTitle || "Unknown",
              chapterTitle,
              targetCount,
              candidates: cleanCandidates.map((candidate) => ({
                anchorId: candidate.anchorId,
                kind: candidate.kind,
                excerpt: candidate.excerpt,
              })),
            }),
          },
        ],
      },
    });

    const content = response.choices[0]?.message?.content || "";
    const parsed = extractJsonArray(content);
    const normalized = normalizeSectionSelections(
      parsed,
      cleanCandidates,
      targetCount
    );

    if (normalized.length === 0) {
      const fallbackSelections = fallback();
      log.finish({
        fallback: true,
        reason: "no usable selections",
        response: summarizePayload({ response: content }),
      });
      return fallbackSelections;
    }

    log.finish({ selections: normalized.length });
    return normalized;
  } catch (error) {
    log.fail(error);
    throw error;
  }
}
