import { MAX_ATLAS_CHARACTERS, MAX_ATLAS_LOCATIONS } from "@/lib/storyAtlas/constants";

function slugify(value) {
  return String(value || "item")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

function extractJsonObject(content) {
  const text = String(content || "").trim();
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeRecap(recap) {
  const text = typeof recap?.text === "string" ? recap.text.trim() : "";
  const confidence = ["high", "low", "none"].includes(recap?.confidence)
    ? recap.confidence
    : text
      ? "low"
      : "none";

  if (!text || confidence === "none") {
    return { text: "", confidence: "none" };
  }

  return { text, confidence };
}

function normalizeCharacters(characters, maxCharacters) {
  if (!Array.isArray(characters)) return [];

  const seen = new Set();
  const normalized = [];

  for (const entry of characters) {
    if (normalized.length >= maxCharacters) break;
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    const description =
      typeof entry?.description === "string" ? entry.description.trim() : "";
    const visualBrief =
      typeof entry?.visualBrief === "string" ? entry.visualBrief.trim() : "";

    if (!name || !description || !visualBrief) continue;

    let id = slugify(
      typeof entry?.id === "string" && entry.id.trim() ? entry.id : name
    );
    if (!id) id = slugify(name);
    if (seen.has(id)) {
      id = `${id}-${normalized.length + 1}`;
    }
    seen.add(id);

    normalized.push({ id, name, description, visualBrief });
  }

  return normalized;
}

function normalizeLocations(locations, maxLocations) {
  if (!Array.isArray(locations)) return [];

  const seen = new Set();
  const normalized = [];

  for (const entry of locations) {
    if (normalized.length >= maxLocations) break;
    const name = typeof entry?.name === "string" ? entry.name.trim() : "";
    const meaning =
      typeof entry?.meaning === "string" ? entry.meaning.trim() : "";
    if (!name || !meaning) continue;

    let id = slugify(
      typeof entry?.id === "string" && entry.id.trim() ? entry.id : name
    );
    if (!id) id = slugify(name);
    if (seen.has(id)) {
      id = `${id}-${normalized.length + 1}`;
    }
    seen.add(id);

    normalized.push({ id, name, meaning });
  }

  return normalized;
}

export function normalizeStoryAtlasPlan(raw, limits = {}) {
  const maxCharacters = limits.maxCharacters ?? MAX_ATLAS_CHARACTERS;
  const maxLocations = limits.maxLocations ?? MAX_ATLAS_LOCATIONS;
  const parsed = typeof raw === "string" ? extractJsonObject(raw) : raw;

  if (!parsed || typeof parsed !== "object") {
    return null;
  }

  const recap = normalizeRecap(parsed.recap);
  const characters = normalizeCharacters(parsed.characters, maxCharacters);
  const locations = normalizeLocations(parsed.locations, maxLocations);

  if (
    !recap.text &&
    characters.length === 0 &&
    locations.length === 0
  ) {
    return null;
  }

  return { recap, characters, locations };
}

export function mockStoryAtlasPlan() {
  return {
    recap: {
      text: "Earlier events set the stage: alliances formed, old debts lingered, and the world grew more dangerous before this volume begins.",
      confidence: "low",
    },
    characters: [
      {
        id: "lead",
        name: "The Protagonist",
        description:
          "A determined figure caught between duty and doubt, still learning who to trust.",
        visualBrief:
          "early 30s, fair skin, shoulder-length windswept brown hair, grey eyes, lean build, practical layered travel clothes, reserved thoughtful expression",
      },
      {
        id: "ally",
        name: "The Companion",
        description:
          "Quick-witted and loyal, offering humor and sharp instincts at the journey's start.",
        visualBrief:
          "mid 20s, warm brown skin, short black curls, dark lively eyes, slim build, layered cloak with a satchel strap, warm easy smile",
      },
    ],
    locations: [
      {
        id: "home",
        name: "The Starting Realm",
        meaning:
          "A familiar homeland whose politics and geography shape the hero's first steps.",
      },
    ],
  };
}
