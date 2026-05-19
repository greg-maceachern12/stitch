import { ApiError } from "./errors";
import { logApiCall, summarizePayload } from "./logger";
import { getOpenRouterModel, requireOpenRouterClient } from "./openrouter";

const PLACEHOLDER_PROMPT =
  "A misty forest path at dawn, golden light through ancient trees, cinematic painted illustration, oil painting with visible brushstrokes, dramatic lighting, widescreen composition, rich atmospheric depth.";

const SYSTEM_PROMPT = `Create a prompt for an image generator that visually captures a specific chapter of a well-known book.

Focus on atmospheric elements, surroundings, and objects. Do not focus on character faces.
Every prompt must describe the scene in a cinematic painted style: oil or gouache painting, visible brushwork, dramatic cinematic lighting, rich color grading, widescreen composition, and atmospheric depth—like a painted film still.
If you do not know the book or chapter well enough to illustrate it, reply with only the word False.
Otherwise reply with only the image prompt, no other commentary.`;

export async function generateImagePrompt(bookTitle, chapterTitle) {
  if (!chapterTitle || typeof chapterTitle !== "string") {
    throw new ApiError("chapterTitle is required", 400);
  }

  if (process.env.API_USE_MOCKS === "true") {
    logApiCall("OpenRouter chat", { mock: true }).finish();
    return PLACEHOLDER_PROMPT;
  }

  const model = getOpenRouterModel();
  const log = logApiCall("OpenRouter chat", {
    provider: "openrouter",
    model,
    request: summarizePayload({ bookTitle, chapterTitle }),
  });

  const client = requireOpenRouterClient("ChatGPT route");

  try {
    const response = await client.chat.send({
      chatRequest: {
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
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
