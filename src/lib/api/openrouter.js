import { OpenRouter } from "@openrouter/sdk";
import { ApiError } from "./errors";

const DEFAULT_MODEL = "openai/gpt-4o-mini";

export function getOpenRouterModel() {
  return process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
}

export function requireOpenRouterClient(routeLabel) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new ApiError(
      `${routeLabel} not configured. Add OPENROUTER_API_KEY to .env.local or set API_USE_MOCKS=true.`,
      501
    );
  }
  return new OpenRouter({ apiKey });
}
