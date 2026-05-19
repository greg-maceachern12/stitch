const PREFIX = "[API]";

function shouldLog() {
  if (process.env.API_DEBUG === "false") return false;
  if (process.env.API_DEBUG === "true") return true;
  return process.env.NODE_ENV !== "production";
}

export function truncate(value, max = 100) {
  if (value == null) return value;
  const text = String(value);
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Shape request metadata for logs without dumping huge prompts. */
export function summarizePayload(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const summary = { ...payload };
  if (summary.prompt) summary.prompt = truncate(summary.prompt);
  if (summary.response) summary.response = truncate(summary.response);
  return summary;
}

function logMeta(meta) {
  const entries = Object.entries(meta).filter(([, v]) => v !== undefined);
  return entries.length ? Object.fromEntries(entries) : undefined;
}

/**
 * @returns {{ finish: (extra?: object) => void, fail: (error: unknown, extra?: object) => void }}
 */
export function logApiCall(label, meta = {}) {
  const noop = () => {};
  if (!shouldLog()) {
    return { finish: noop, fail: noop };
  }

  const start = Date.now();
  const baseMeta = logMeta(meta);
  console.log(`${PREFIX} → ${label}`, baseMeta ?? "");

  return {
    finish(extra = {}) {
      const durationMs = Date.now() - start;
      console.log(`${PREFIX} ✓ ${label} (${durationMs}ms)`, {
        ...(baseMeta ?? {}),
        ...logMeta(extra),
        durationMs,
      });
    },
    fail(error, extra = {}) {
      const durationMs = Date.now() - start;
      const err =
        error instanceof Error ? error : new Error(String(error ?? "Unknown error"));
      console.error(`${PREFIX} ✗ ${label} (${durationMs}ms)`, {
        ...(baseMeta ?? {}),
        ...logMeta(extra),
        durationMs,
        error: err.message,
        status: err.status,
      });
    },
  };
}
