import JSZip from "jszip";

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

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

/** Re-parse HTML so the browser fixes mismatched or unclosed tags from epubjs. */
function repairHtmlFragmentWithDom(html) {
  const template = document.createElement("template");
  template.innerHTML = html;
  const container = document.createElement("div");
  container.append(...template.content.childNodes);
  return container.innerHTML;
}

/** HTML void tags must be self-closing in XHTML or parsers treat them as unclosed. */
function normalizeVoidElementsForXhtml(html) {
  let result = html;

  for (const tag of VOID_HTML_ELEMENTS) {
    result = result.replace(
      new RegExp(`<${tag}((?:\\s+[^>]*)?)>`, "gi"),
      (match, attrs = "") => `<${tag}${attrs} />`
    );
    result = result.replace(new RegExp(`</${tag}\\s*>`, "gi"), "");
  }

  return result;
}

/**
 * EPUB chapter XHTML must be well-formed XML. HTML fragments from epubjs often
 * contain named entities (e.g. &nbsp;) that are undefined without an HTML DTD.
 */
function sanitizeHtmlForXhtml(html) {
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

function chapterFileName(index) {
  return `chapter-${String(index + 1).padStart(3, "0")}.xhtml`;
}

function imageFileName(index) {
  return `images/ch-${String(index + 1).padStart(3, "0")}.jpg`;
}

async function fetchImageAsArrayBuffer(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.status}`);
  }
  return response.arrayBuffer();
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

function buildChapterXhtml(title, bodyHtml, imagePath) {
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

export async function buildEpub({ title, author, cover, chapters }) {
  const zip = new JSZip();
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const manifestItems = [];
  const spineItems = [];
  const navPoints = [];

  zip.file(
    "mimetype",
    "application/epub+zip",
    { compression: "STORE" }
  );

  zip.folder("META-INF").file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  const oebps = zip.folder("OEBPS");
  oebps.file(
    "styles.css",
    `body {
  font-family: Georgia, serif;
  line-height: 1.6;
  margin: 1em;
}

.chapter-title {
  margin-bottom: 0.5em;
}

.chapter-opener {
  margin: 1.25em 0 1.75em;
  text-align: center;
  page-break-inside: avoid;
  break-inside: avoid;
}

.chapter-opener__figure {
  margin: 0;
  padding: 0;
}

.chapter-opener__image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.chapter-opener__caption {
  margin-top: 0.75em;
  font-size: 0.85em;
  font-style: italic;
  color: #555555;
}

.chapter-prose {
  margin-top: 0;
}`
  );
  manifestItems.push(
    '<item id="style" href="styles.css" media-type="text/css"/>'
  );

  let coverImagePath = null;
  if (cover?.startsWith("data:")) {
    const base64 = cover.split(",")[1];
    coverImagePath = "images/cover.jpg";
    oebps.file(coverImagePath, base64, { base64: true });
    manifestItems.push(
      `<item id="cover-image" href="${coverImagePath}" media-type="image/jpeg" properties="cover-image"/>`
    );
    oebps.file(
      "cover.xhtml",
      `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head><title>Cover</title></head>
<body><img src="${coverImagePath}" alt="Cover"/></body>
</html>`
    );
    manifestItems.push(
      '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>'
    );
    spineItems.push('<itemref idref="cover"/>');
  }

  for (let i = 0; i < sortedChapters.length; i++) {
    const chapter = sortedChapters[i];
    const fileName = chapterFileName(i);
    const itemId = `chapter-${i + 1}`;
    let imagePath = null;

    if (chapter.imageUrl) {
      try {
        const imageBuffer = await fetchImageAsArrayBuffer(chapter.imageUrl);
        imagePath = imageFileName(i);
        oebps.file(imagePath, imageBuffer);
        manifestItems.push(
          `<item id="img-${i + 1}" href="${imagePath}" media-type="image/jpeg"/>`
        );
      } catch (error) {
        console.error(`Skipping image for chapter "${chapter.title}":`, error);
      }
    }

    const xhtml = buildChapterXhtml(chapter.title, chapter.html, imagePath);
    oebps.file(fileName, xhtml);
    manifestItems.push(
      `<item id="${itemId}" href="${fileName}" media-type="application/xhtml+xml"/>`
    );
    spineItems.push(`<itemref idref="${itemId}"/>`);
    navPoints.push(
      `<navPoint id="nav-${i + 1}" playOrder="${i + 1}">
        <navLabel><text>${escapeXml(chapter.title)}</text></navLabel>
        <content src="${fileName}"/>
      </navPoint>`
    );
  }

  const modifiedDate = new Date().toISOString().split("T")[0];

  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">visuai-${Date.now()}</dc:identifier>
    <dc:title>${escapeXml(title)}</dc:title>
    <dc:creator>${escapeXml(author || "Unknown")}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${modifiedDate}</dc:date>
    <meta property="dcterms:modified">${modifiedDate}</meta>
  </metadata>
  <manifest>
    ${manifestItems.join("\n    ")}
  </manifest>
  <spine>
    ${spineItems.join("\n    ")}
  </spine>
</package>`
  );

  oebps.file(
    "toc.ncx",
    `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="visuai-${Date.now()}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    ${navPoints.join("\n    ")}
  </navMap>
</ncx>`
  );

  const blob = await zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });

  return blob;
}
