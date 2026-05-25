import JSZip from "jszip";
import { fetchImageAsArrayBuffer } from "./assets";
import { buildChapterXhtml, escapeXml } from "./xhtml";

const EPUB_STYLES = `body {
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
}`;

function chapterFileName(index) {
  return `chapter-${String(index + 1).padStart(3, "0")}.xhtml`;
}

function imageFileName(index) {
  return `images/ch-${String(index + 1).padStart(3, "0")}.jpg`;
}

function addContainer(zip) {
  zip.file("mimetype", "application/epub+zip", { compression: "STORE" });

  zip.folder("META-INF").file(
    "container.xml",
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );
}

function addStyles(oebps, manifestItems) {
  oebps.file("styles.css", EPUB_STYLES);
  manifestItems.push(
    '<item id="style" href="styles.css" media-type="text/css"/>'
  );
}

function addCover(oebps, cover, manifestItems, spineItems) {
  if (!cover?.startsWith("data:")) {
    return;
  }

  const base64 = cover.split(",")[1];
  const coverImagePath = "images/cover.jpg";

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

async function addChapter(oebps, chapter, index, manifestItems, spineItems, navPoints) {
  const fileName = chapterFileName(index);
  const itemId = `chapter-${index + 1}`;
  let imagePath = null;

  if (chapter.imageUrl) {
    try {
      const imageBuffer = await fetchImageAsArrayBuffer(chapter.imageUrl);
      imagePath = imageFileName(index);
      oebps.file(imagePath, imageBuffer);
      manifestItems.push(
        `<item id="img-${index + 1}" href="${imagePath}" media-type="image/jpeg"/>`
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
    `<navPoint id="nav-${index + 1}" playOrder="${index + 1}">
        <navLabel><text>${escapeXml(chapter.title)}</text></navLabel>
        <content src="${fileName}"/>
      </navPoint>`
  );
}

function addPackageFiles(oebps, { title, author, manifestItems, spineItems, navPoints }) {
  const modifiedDate = new Date().toISOString().split("T")[0];
  const id = `visuai-${Date.now()}`;

  oebps.file(
    "content.opf",
    `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="book-id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="book-id">${id}</dc:identifier>
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
    <meta name="dtb:uid" content="${id}"/>
    <meta name="dtb:depth" content="1"/>
  </head>
  <docTitle><text>${escapeXml(title)}</text></docTitle>
  <navMap>
    ${navPoints.join("\n    ")}
  </navMap>
</ncx>`
  );
}

export async function buildEpub({ title, author, cover, chapters }) {
  const zip = new JSZip();
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const manifestItems = [];
  const spineItems = [];
  const navPoints = [];

  addContainer(zip);

  const oebps = zip.folder("OEBPS");
  addStyles(oebps, manifestItems);
  addCover(oebps, cover, manifestItems, spineItems);

  for (let i = 0; i < sortedChapters.length; i++) {
    await addChapter(
      oebps,
      sortedChapters[i],
      i,
      manifestItems,
      spineItems,
      navPoints
    );
  }

  addPackageFiles(oebps, {
    title,
    author,
    manifestItems,
    spineItems,
    navPoints,
  });

  return zip.generateAsync({
    type: "blob",
    mimeType: "application/epub+zip",
    compression: "DEFLATE",
    compressionOptions: { level: 9 },
  });
}
