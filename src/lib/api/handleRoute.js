import { ApiError, jsonError } from "./errors";
import { logApiCall, summarizePayload } from "./logger";

export async function handlePost(request, handler, routeLabel) {
  const label = routeLabel || "POST (unknown route)";
  const log = logApiCall(label, { method: "POST" });

  try {
    const body = await request.json();
    const result = await handler(body);
    const status = result instanceof Response ? result.status : 200;
    log.finish({ request: summarizePayload(body), status });
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
