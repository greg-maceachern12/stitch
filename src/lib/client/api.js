import { logApiCall, summarizePayload } from "@/lib/api/logger";
import { getStoredOpenRouterApiKey } from "@/lib/client/openRouterApiKey";
import { getImageModel } from "@/lib/imageModels";

const GENERATE_PROMPT_API = "/api/generate-prompt";
const GENERATE_IMAGE_API = "/api/generate-image";
const SELECT_ILLUSTRATION_SECTIONS_API = "/api/select-illustration-sections";
const GENERATE_STORY_ATLAS_PLAN_API = "/api/generate-story-atlas-plan";
const OPENROUTER_API_KEY_HEADER = "x-openrouter-api-key";

function routeLabel(url) {
  try {
    return `POST ${new URL(url, window.location.origin).pathname}`;
  } catch {
    return `POST ${url}`;
  }
}

async function postJson(url, body) {
  const log = logApiCall(routeLabel(url), {
    request: summarizePayload(body),
  });

  const openRouterApiKey = getStoredOpenRouterApiKey();
  const headers = { "Content-Type": "application/json" };
  if (openRouterApiKey) {
    headers[OPENROUTER_API_KEY_HEADER] = openRouterApiKey;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
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

export async function generateChapterImagePrompt(
  bookTitle,
  chapterTitle,
  imageStyle
) {
  const data = await postJson(GENERATE_PROMPT_API, {
    bookTitle,
    chapterTitle,
    imageStyle,
  });
  return data.response;
}

export async function generateImageFromPrompt(prompt, imageStyle, imageModel) {
  const { id: resolvedModel } = getImageModel(imageModel);
  const data = await postJson(GENERATE_IMAGE_API, {
    prompt,
    imageStyle,
    imageModel: resolvedModel,
  });

  if (!data.result?.[0]) {
    throw new Error("No image URL returned from image API");
  }

  return data.result[0];
}

export async function selectIllustrationSections({
  bookTitle,
  chapterTitle,
  imageStyle,
  targetCount,
  candidates,
}) {
  const data = await postJson(SELECT_ILLUSTRATION_SECTIONS_API, {
    bookTitle,
    chapterTitle,
    imageStyle,
    targetCount,
    candidates,
  });

  return Array.isArray(data.sections) ? data.sections : [];
}

export async function generateStoryAtlasPlan(payload) {
  const data = await postJson(GENERATE_STORY_ATLAS_PLAN_API, payload);
  return data.plan ?? null;
}
