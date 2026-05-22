import { getImageStyle } from "@/lib/imageStyles";
import { ApiError } from "./errors";
import { logApiCall, summarizePayload } from "./logger";
import { getOpenRouterTextModel, requireOpenRouterClient } from "./openrouter";

const PLACEHOLDER_PROMPTS = {
  "oil-painting":
    "A misty forest path at dawn, golden light through ancient trees, cinematic painted illustration, oil painting with visible brushstrokes, dramatic lighting, widescreen composition, rich atmospheric depth.",
  watercolor:
    "A misty forest path at dawn, golden light through ancient trees, soft watercolor illustration with translucent washes and gentle edges, storybook atmosphere.",
  anime:
    "A misty forest path at dawn, golden light through ancient trees, anime illustration with clean cel shading, vibrant colors, and detailed backgrounds.",
  photoreal:
    "A misty forest path at dawn, golden light through ancient trees, photorealistic cinematic still with natural lighting and shallow depth of field.",
};

function buildSystemPrompt(promptStyleGuide) {
  return `Create a prompt for an image generator that visually captures a specific chapter of a well-known book.

Focus on atmospheric elements, surroundings, and objects. Do not focus on character faces.
Every prompt must describe the scene in this visual style: ${promptStyleGuide}
If you do not know the book or chapter well enough to illustrate it, reply with only the word False.
Otherwise reply with only the image prompt, no other commentary.`;
}

export async function generateImagePrompt(
  bookTitle,
  chapterTitle,
  imageStyle
) {
  if (!chapterTitle || typeof chapterTitle !== "string") {
    throw new ApiError("chapterTitle is required", 400);
  }

  const style = getImageStyle(imageStyle);

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("OpenRouter prompt", { mock: true, imageStyle: style.id }).finish();
    return PLACEHOLDER_PROMPTS[style.id] ?? PLACEHOLDER_PROMPTS["oil-painting"];
  }

  const model = getOpenRouterTextModel();
  const log = logApiCall("OpenRouter prompt", {
    provider: "openrouter",
    model,
    imageStyle: style.id,
    request: summarizePayload({ bookTitle, chapterTitle, imageStyle: style.id }),
  });

  const client = requireOpenRouterClient("Prompt generation");

  try {
    const response = await client.chat.send({
      chatRequest: {
        model,
        messages: [
          { role: "system", content: buildSystemPrompt(style.promptStyleGuide) },
          {
            role: "user",
            content: `Book: ${bookTitle || "Unknown"}\nChapter: ${chapterTitle}`,
          },
        ],
      },
    });

    const content = response.choices[0]?.message?.content?.trim() || "False";
    log.finish({
      response: summarizePayload({ response: content }),
      declined: content === "False",
    });
    return content;
  } catch (error) {
    log.fail(error);
    throw error;
  }
}
