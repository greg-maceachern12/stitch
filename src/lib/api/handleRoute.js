import { ApiError, jsonError } from "./errors";
import { logApiCall, summarizePayload } from "./logger";
import { runWithOpenRouterApiKey } from "./openrouter";

const OPENROUTER_API_KEY_HEADER = "x-openrouter-api-key";

export async function handlePost(request, handler, routeLabel) {
  const label = routeLabel || "POST (unknown route)";
  const log = logApiCall(label, { method: "POST" });

  try {
    const body = await request.json();
    const userApiKey = request.headers.get(OPENROUTER_API_KEY_HEADER);
    const result = await runWithOpenRouterApiKey(userApiKey, () =>
      handler(body)
    );
    const status = result instanceof Response ? result.status : 200;
    log.finish({
      request: summarizePayload(body),
      status,
      usingUserApiKey: Boolean(userApiKey?.trim()),
    });
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      log.fail(error, { status: error.status });
      return jsonError(error.message, error.status);
    }
    log.fail(error, { status: 500 });
    return jsonError("Internal server error", 500);
  }
}
