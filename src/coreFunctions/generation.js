import { logApiCall, summarizePayload } from "@/lib/api/logger";
import { generateImageApi, generatePromptApi } from "../utils/apiConfig";

function routeLabel(url) {
  try {
    return `POST ${new URL(url).pathname}`;
  } catch {
    return `POST ${url}`;
  }
}

async function postJson(url, body) {
  const log = logApiCall(routeLabel(url), {
    request: summarizePayload(body),
  });

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.error || `Request failed: ${response.status}`);
    error.status = response.status;
    log.fail(error, { status: response.status });
    throw error;
  }

  const data = await response.json();
  log.finish({ status: response.status });
  return data;
}

export async function generateChapterImagePrompt(bookTitle, chapterTitle) {
  const data = await postJson(generatePromptApi, { bookTitle, chapterTitle });
  return data.response;
}

export async function generateImageFromPrompt(prompt) {
  const data = await postJson(generateImageApi, {
    prompt,
    cheapModel: false,
  });

  if (!data.result?.[0]) {
    throw new Error("No image URL returned from image API");
  }

  return data.result[0];
}
