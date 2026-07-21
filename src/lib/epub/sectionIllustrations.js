import { escapeXml } from "./xhtml";

const MIN_PARAGRAPH_CHARS = 120;
const MIN_HEADING_CHARS = 8;
const EXCERPT_CHARS = 1200;
const MAX_SELECTION_CANDIDATES = 48;
export const WORDS_PER_ILLUSTRATION = 1000;
export const MIN_SECTION_ILLUSTRATIONS_PER_CHAPTER = 1;
export const MAX_SECTION_ILLUSTRATIONS_PER_CHAPTER = 4;

const CANDIDATE_SELECTOR = "h2, h3, h4, h5, h6, p";
const SKIP_TEXT_PATTERNS = [
  /^chapter\s+\d+$/i,
  /^contents?$/i,
  /^copyright$/i,
  /^all rights reserved/i,
  /^isbn\b/i,
  /^www\./i,
  /^https?:\/\//i,
];

function normalizeWhitespace(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function countWords(value) {
  const text = normalizeWhitespace(value);
  if (!text) return 0;
  return text.split(/\s+/).length;
}

function compactExcerpt(value, max = EXCERPT_CHARS) {
  const text = normalizeWhitespace(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).trimEnd()}…`;
}

function isHeading(element) {
  return /^H[2-6]$/i.test(element.tagName);
}

function isMeaningfulText(text, element) {
  if (!text) return false;
  if (SKIP_TEXT_PATTERNS.some((pattern) => pattern.test(text))) return false;
  if (isHeading(element)) return text.length >= MIN_HEADING_CHARS;
  return text.length >= MIN_PARAGRAPH_CHARS;
}

function contextTextFor(element) {
  const pieces = [normalizeWhitespace(element.textContent)];

  if (isHeading(element)) {
    let sibling = element.nextElementSibling;
    while (sibling && pieces.join(" ").length < EXCERPT_CHARS) {
      if (sibling.matches?.("p, h2, h3, h4, h5, h6")) {
        const text = normalizeWhitespace(sibling.textContent);
        if (text) pieces.push(text);
        if (/^H[2-6]$/i.test(sibling.tagName)) break;
      }
      sibling = sibling.nextElementSibling;
    }
  }

  return compactExcerpt(pieces.join(" "));
}

function candidateScore(candidate) {
  const text = candidate.excerpt.toLowerCase();
  const quotedText = (candidate.excerpt.match(/[“”"]/g) || []).length;
  const sensoryWords = [
    "blood",
    "fire",
    "light",
    "dark",
    "shadow",
    "forest",
    "street",
    "room",
    "door",
    "sky",
    "storm",
    "river",
    "mountain",
    "sword",
    "horse",
    "ship",
    "castle",
    "garden",
    "gold",
    "smoke",
  ].filter((word) => text.includes(word)).length;

  return candidate.excerpt.length + sensoryWords * 80 - quotedText * 12;
}

export function getTargetIllustrationCount(wordCount, candidateCount = Infinity) {
  const words = Math.max(0, Number(wordCount) || 0);
  const candidates = Math.max(0, Number(candidateCount) || 0);
  if (candidates <= 0) return 0;
  const byLength = Math.max(1, Math.ceil(words / WORDS_PER_ILLUSTRATION));
  const minimum = candidates >= MIN_SECTION_ILLUSTRATIONS_PER_CHAPTER
    ? MIN_SECTION_ILLUSTRATIONS_PER_CHAPTER
    : 1;
  return Math.min(
    Math.max(byLength, minimum),
    candidates,
    MAX_SECTION_ILLUSTRATIONS_PER_CHAPTER
  );
}

export function prepareChapterForSectionIllustrations(html, chapterIndex = 0) {
  const template = document.createElement("template");
  template.innerHTML = html || "";

  template.content.querySelectorAll("img, figure, picture, svg").forEach((node) => {
    node.remove();
  });

  const candidates = [];
  const elements = Array.from(template.content.querySelectorAll(CANDIDATE_SELECTOR));

  elements.forEach((element, index) => {
    const text = normalizeWhitespace(element.textContent);
    if (!isMeaningfulText(text, element)) return;

    const anchorId = `visuai-ch-${chapterIndex + 1}-sec-${candidates.length + 1}`;
    element.setAttribute("data-visuai-anchor", anchorId);

    candidates.push({
      anchorId,
      index,
      kind: element.tagName.toLowerCase(),
      text,
      excerpt: contextTextFor(element),
    });
  });

  const wordCount = countWords(template.content.textContent);

  const selectionCandidates = [...candidates]
    .sort((a, b) => candidateScore(b) - candidateScore(a))
    .slice(0, MAX_SELECTION_CANDIDATES)
    .sort((a, b) => a.index - b.index);

  return {
    html: template.innerHTML,
    candidates,
    selectionCandidates,
    targetCount: getTargetIllustrationCount(wordCount, candidates.length),
  };
}

export function buildFallbackSectionSelections({
  bookTitle,
  chapterTitle,
  imageStyle,
  candidates,
  targetCount,
}) {
  const count = Math.min(
    Math.max(0, Number(targetCount) || 0),
    candidates.length
  );

  return [...candidates]
    .sort((a, b) => candidateScore(b) - candidateScore(a))
    .slice(0, count)
    .sort((a, b) => a.index - b.index)
    .map((candidate, index) => ({
      anchorId: candidate.anchorId,
      prompt: [
        `Illustrate this moment from ${bookTitle || "the book"}, chapter "${chapterTitle || "Untitled"}".`,
        candidate.excerpt,
        `Create a scene-specific ${imageStyle || "illustration"} image with atmospheric surroundings, objects, lighting, and composition. Avoid close-up character faces.`,
      ].join(" "),
      altText: `Illustration for section ${index + 1} of ${chapterTitle || "this chapter"}`,
      caption: "Section illustration",
    }));
}

export function normalizeSectionSelections(selections, candidates, targetCount) {
  const allowedAnchors = new Set(candidates.map((candidate) => candidate.anchorId));
  const seenAnchors = new Set();
  const count = Math.min(
    Math.max(0, Number(targetCount) || 0),
    candidates.length
  );

  if (!Array.isArray(selections) || count === 0) return [];

  return selections
    .filter((selection) => {
      const anchorId = selection?.anchorId;
      if (!allowedAnchors.has(anchorId) || seenAnchors.has(anchorId)) {
        return false;
      }
      seenAnchors.add(anchorId);
      return true;
    })
    .slice(0, count)
    .map((selection, index) => ({
      anchorId: selection.anchorId,
      prompt: normalizeWhitespace(selection.prompt),
      altText:
        normalizeWhitespace(selection.altText) ||
        `Illustration for selected chapter section ${index + 1}`,
      caption: normalizeWhitespace(selection.caption) || "Section illustration",
    }))
    .filter((selection) => selection.prompt.length > 0);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildIllustrationFigureHtml(illustration, src) {
  const alt = escapeXml(illustration.altText || "Section illustration");
  const caption = illustration.caption
    ? `<figcaption class="section-illustration__caption">${escapeXml(illustration.caption)}</figcaption>`
    : "";

  return `<figure class="section-illustration" epub:type="figure"><img class="section-illustration__image" src="${escapeXml(src)}" alt="${alt}"/>${caption}</figure>`;
}

/**
 * Find the index just after the full HTML element that carries the given
 * data-visuai-anchor, so illustrations can be placed below the passage.
 * Returns -1 when the anchor or a matching close tag cannot be found.
 */
function findInsertIndexAfterAnchoredElement(html, anchorId) {
  const openPattern = new RegExp(
    `<([a-z][a-z0-9]*)\\b[^>]*\\bdata-visuai-anchor="${escapeRegExp(anchorId)}"[^>]*>`,
    "i"
  );
  const openMatch = openPattern.exec(html);
  if (!openMatch) return -1;

  const tagName = openMatch[1].toLowerCase();
  const afterOpen = openMatch.index + openMatch[0].length;
  const tagPattern = new RegExp(`</?${escapeRegExp(tagName)}\\b[^>]*>`, "gi");
  tagPattern.lastIndex = afterOpen;

  let depth = 1;
  let match;
  while ((match = tagPattern.exec(html)) !== null) {
    const isClose = match[0].startsWith("</");
    depth += isClose ? -1 : 1;
    if (depth === 0) {
      return match.index + match[0].length;
    }
  }

  return -1;
}

/**
 * Inserts illustration markup as HTML strings (not live DOM nodes) so the browser
 * does not request EPUB-relative paths like /images/ch-001-ill-001.jpg during
 * client-side assembly. Figures are placed immediately after the anchored passage.
 */
export function insertIllustrationsIntoHtml(html, illustrations = []) {
  if (!illustrations.length) return html || "";

  const anchored = illustrations
    .filter(
      (illustration) =>
        illustration?.anchorId &&
        (illustration.imagePath || illustration.imageUrl)
    )
    .map((illustration) => ({
      illustration,
      insertAt: findInsertIndexAfterAnchoredElement(
        html || "",
        illustration.anchorId
      ),
    }))
    .filter((entry) => entry.insertAt >= 0)
    .sort((a, b) => b.insertAt - a.insertAt);

  if (!anchored.length) return html || "";

  let result = html || "";

  for (const { illustration, insertAt } of anchored) {
    const src = illustration.imagePath ?? illustration.imageUrl;
    const figureHtml = buildIllustrationFigureHtml(illustration, src);
    result = `${result.slice(0, insertAt)}${figureHtml}${result.slice(insertAt)}`;
  }

  return result;
}
