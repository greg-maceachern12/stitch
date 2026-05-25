import { readFile } from "fs/promises";
import { join } from "path";

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

function mimeTypeForPath(filePath) {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return MIME_BY_EXT[ext] ?? "image/jpeg";
}

function isLocalHostname(hostname) {
  if (!hostname) return false;
  const h = hostname.toLowerCase();
  if (h === "localhost" || h === "127.0.0.1" || h === "::1" || h.endsWith(".local")) {
    return true;
  }
  if (/^10\./.test(h)) return true;
  if (/^192\.168\./.test(h)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(h)) return true;
  return false;
}

/** Path under `public/` for bundled style refs, or null if URL is external-only. */
function publicRelativePath(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
  if (pathOrUrl.startsWith("/")) {
    return pathOrUrl.slice(1);
  }
  try {
    const url = new URL(pathOrUrl);
    if (isLocalHostname(url.hostname)) {
      const pathname = url.pathname;
      return pathname.startsWith("/") ? pathname.slice(1) : pathname;
    }
  } catch {
    return null;
  }
  return null;
}

async function readPublicFileAsDataUrl(relativePath) {
  const filePath = join(process.cwd(), "public", relativePath);
  const buffer = await readFile(filePath);
  const mime = mimeTypeForPath(relativePath);
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

/**
 * Resolves a style reference for OpenRouter. Local paths and localhost URLs are
 * inlined from `public/` as base64 — the provider cannot fetch localhost.
 */
export async function resolveStyleReferenceForApi(pathOrUrl) {
  if (!pathOrUrl || typeof pathOrUrl !== "string") {
    return null;
  }

  const relative = publicRelativePath(pathOrUrl);
  if (relative) {
    return readPublicFileAsDataUrl(relative);
  }

  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  return null;
}
