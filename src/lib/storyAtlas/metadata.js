function parseSeriesIndex(value) {
  if (value == null || value === "") return null;
  const numeric = Number.parseFloat(String(value).trim());
  if (!Number.isFinite(numeric) || numeric < 1) return null;
  return Math.floor(numeric);
}

function readMetaField(metadata, keys) {
  if (!metadata || typeof metadata !== "object") return null;
  for (const key of keys) {
    const value = metadata[key];
    if (value != null && String(value).trim()) {
      return String(value).trim();
    }
  }
  return null;
}

function seriesIndexFromTitle(title) {
  if (!title) return null;
  const patterns = [
    /\bbook\s+(\d+)\b/i,
    /\bvolume\s+(\d+)\b/i,
    /\b#\s*(\d+)\b/,
    /\((\d+)\s*(?:of|\/)\s*\d+\)/i,
    /\bpart\s+(\d+)\b/i,
  ];
  for (const pattern of patterns) {
    const match = title.match(pattern);
    if (match) {
      const index = parseSeriesIndex(match[1]);
      if (index) return index;
    }
  }
  return null;
}

/**
 * @param {Record<string, unknown>} metadata epub.js loaded.metadata
 * @param {Record<string, unknown> | null} packageMetadata epub.js loaded.package metadata
 */
export function extractBookIdentity(metadata, packageMetadata = null) {
  const merged = { ...packageMetadata, ...metadata };
  const bookTitle =
    readMetaField(merged, ["title", "dc:title"]) || "Untitled";
  const author =
    readMetaField(merged, ["creator", "dc:creator", "author"]) || "Unknown";

  const seriesName = readMetaField(merged, [
    "calibre:series",
    "belongs-to-collection",
    "series",
    "meta-series",
  ]);

  let seriesIndex =
    parseSeriesIndex(
      readMetaField(merged, [
        "calibre:series_index",
        "calibre:series-index",
        "series_index",
        "series-index",
      ])
    ) ?? seriesIndexFromTitle(bookTitle);

  return {
    bookTitle,
    author,
    seriesName,
    seriesIndex,
  };
}
