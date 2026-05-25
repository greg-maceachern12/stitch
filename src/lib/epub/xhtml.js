const XML_PREDEFINED_ENTITIES = new Set(["amp", "lt", "gt", "quot", "apos"]);

const VOID_HTML_ELEMENTS = [
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
];

export function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function repairHtmlFragmentWithDom(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const container = document.createElement("div");
  container.append(...template.content.childNodes);
  return container.innerHTML;
}

function normalizeVoidElementsForXhtml(html) {
  let result = html;

  for (const tag of VOID_HTML_ELEMENTS) {
    result = result.replace(
      new RegExp(`<${tag}((?:\\s+[^>]*)?)>`, "gi"),
      (_match, attrs = "") => `<${tag}${attrs} />`
    );
    result = result.replace(new RegExp(`</${tag}\\s*>`, "gi"), "");
  }

  return result;
}

export function sanitizeHtmlForXhtml(html) {
  if (!html) return "";

  const repairedHtml = repairHtmlFragmentWithDom(html);
  const withNamedEntitiesResolved = repairedHtml.replace(
    /&([a-zA-Z][a-zA-Z0-9]*);/g,
    (match, name) => {
      const lower = name.toLowerCase();
      if (XML_PREDEFINED_ENTITIES.has(lower)) {
        return match;
      }

      const textarea = document.createElement("textarea");
      textarea.innerHTML = match;
      const decoded = textarea.value;

      if (decoded === match) {
        return match;
      }

      return Array.from(decoded)
        .map((char) => `&#${char.codePointAt(0)};`)
        .join("");
    }
  );
  const withVoidElementsNormalized =
    normalizeVoidElementsForXhtml(withNamedEntitiesResolved);

  return withVoidElementsNormalized.replace(
    /&(?!(?:#[0-9]+|#x[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*;))/g,
    "&amp;"
  );
}

export function buildChapterXhtml(title, bodyHtml, imagePath) {
  const opener = imagePath ? buildChapterOpener(imagePath, title) : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <h1 class="chapter-title">${escapeXml(title)}</h1>
  ${opener}
  <div class="chapter-prose">${sanitizeHtmlForXhtml(bodyHtml)}</div>
</body>
</html>`;
}

function buildChapterOpener(imagePath, title) {
  const alt = `Illustration for ${title}`;

  return `<section class="chapter-opener" epub:type="chapter-opener">
  <figure class="chapter-opener__figure">
    <img class="chapter-opener__image" src="${imagePath}" alt="${escapeXml(alt)}"/>
    <figcaption class="chapter-opener__caption">Chapter illustration</figcaption>
  </figure>
</section>`;
}
