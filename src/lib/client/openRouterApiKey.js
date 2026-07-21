const STORAGE_KEY = "visuai:openrouter-api-key";

export function getStoredOpenRouterApiKey() {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY)?.trim() || "";
  } catch {
    return "";
  }
}

export function setStoredOpenRouterApiKey(value) {
  if (typeof window === "undefined") return;
  const trimmed = typeof value === "string" ? value.trim() : "";
  try {
    if (trimmed) {
      localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // Ignore quota / private-mode failures; requests still work with in-memory value if passed.
  }
}
