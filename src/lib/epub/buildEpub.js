import JSZip from "jszip";
import { atlasPortraitPath } from "@/lib/storyAtlas/atlasPaths";
import {
  fetchImageForEpub,
  prepareCoverImageForEpub,
} from "./assets";
import { buildChapterXhtml, escapeXml } from "./xhtml";
import { insertIllustrationsIntoHtml } from "./sectionIllustrations";

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

.section-illustration {
  margin: 1.5em 0 1.75em;
  text-align: center;
  page-break-inside: avoid;
  break-inside: avoid;
}

.section-illustration__image {
  max-width: 100%;
  height: auto;
  display: block;
  margin: 0 auto;
}

.section-illustration__caption {
  margin-top: 0.75em;
  font-size: 0.85em;
  font-style: italic;
  color: #555555;
}

.chapter-prose {
  margin-top: 0;
}
.story-atlas {
  margin: 0;
  padding: 0 0.25em;
}

.atlas-header {
  text-align: center;
  margin: 0 0 2.25em;
  padding: 1.5em 0.75em 1.25em;
  border-bottom: 2px solid #1e3a5f;
}

.atlas-brand {
  font-size: 0.75em;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #0e7490;
  margin: 0 0 0.75em;
}

.atlas-title {
  font-size: 1.65em;
  line-height: 1.25;
  margin: 0 0 0.35em;
  color: #1e3a5f;
}

.atlas-tagline {
  font-size: 0.9em;
  font-style: italic;
  color: #555555;
  margin: 0;
}

.atlas-section {
  margin: 0 0 2.25em;
}

.atlas-section + .atlas-section {
  page-break-before: always;
  break-before: page;
}

.atlas-section__title {
  font-size: 1.15em;
  color: #1e3a5f;
  border-bottom: 1px solid #cbd5e1;
  padding-bottom: 0.35em;
  margin: 0 0 1em;
}

.atlas-recap__callout {
  margin: 0;
  padding: 0.85em 0 0.85em 1em;
  border-left: 3px solid #0e7490;
}

.atlas-recap__callout p {
  margin: 0;
}

.atlas-character-list {
  margin: 0;
  padding: 0;
}

.atlas-character {
  margin: 0 0 2.5em;
  text-align: center;
  page-break-inside: avoid;
  break-inside: avoid;
}

.atlas-character__figure {
  margin: 0 0 0.85em;
  padding: 0;
}

.atlas-character__image {
  width: auto;
  max-width: 85%;
  height: auto;
  display: block;
  margin: 0 auto;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

.atlas-character__name {
  font-size: 1.1em;
  margin: 0 0 0.5em;
  color: #1e3a5f;
}

.atlas-character__about {
  text-align: left;
  margin: 0 auto;
  max-width: 32em;
}

.atlas-character__about p {
  margin: 0;
  line-height: 1.55;
}

.atlas-location-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.atlas-location {
  margin: 0 0 1.25em;
  padding: 0 0 0 1em;
  border-left: 2px solid #cbd5e1;
}

.atlas-location__name {
  font-size: 1em;
  margin: 0 0 0.3em;
  color: #1e3a5f;
}

.atlas-location p {
  margin: 0;
}`;

function chapterFileName(index) {
  return `chapter-${String(index + 1).padStart(3, "0")}.xhtml`;
}

function imageFileName(chapterIndex, illustrationIndex) {
  return `images/ch-${String(chapterIndex + 1).padStart(3, "0")}-ill-${String(
    illustrationIndex + 1
  ).padStart(3, "0")}.jpg`;
}

function openerImageFileName(index) {
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

async function addCover(oebps, cover, manifestItems, spineItems) {
  if (!cover?.startsWith("data:")) {
    return;
  }

  const coverImagePath = "images/cover.jpg";
  const imageBuffer = await prepareCoverImageForEpub(cover);

  oebps.file(coverImagePath, imageBuffer);
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

async function loadStoryAtlasAssets(storyAtlas) {
  if (!storyAtlas?.xhtml) return null;

  const portraits = await Promise.all(
    (storyAtlas.characters ?? []).map(async (character) => {
      if (!character.imageUrl) {
        return { id: character.id, imagePath: null, imageBuffer: null };
      }

      try {
        return {
          id: character.id,
          imagePath: atlasPortraitPath(character.id),
          imageBuffer: await fetchImageForEpub(character.imageUrl),
        };
      } catch (error) {
        console.error(`Skipping atlas portrait for ${character.id}:`, error);
        return { id: character.id, imagePath: null, imageBuffer: null };
      }
    })
  );

  return { xhtml: storyAtlas.xhtml, portraits };
}

function addStoryAtlas(oebps, atlasAssets, manifestItems, spineItems, navPoints) {
  if (!atlasAssets?.xhtml) return;

  for (const portrait of atlasAssets.portraits) {
    if (!portrait.imagePath || !portrait.imageBuffer) continue;
    oebps.file(portrait.imagePath, portrait.imageBuffer);
    manifestItems.push(
      `<item id="atlas-img-${portrait.id}" href="${portrait.imagePath}" media-type="image/jpeg"/>`
    );
  }

  oebps.file("story-atlas.xhtml", atlasAssets.xhtml);
  manifestItems.push(
    '<item id="story-atlas" href="story-atlas.xhtml" media-type="application/xhtml+xml"/>'
  );
  spineItems.push('<itemref idref="story-atlas"/>');
  navPoints.unshift(
    `<navPoint id="nav-atlas" playOrder="0">
        <navLabel><text>Story Atlas</text></navLabel>
        <content src="story-atlas.xhtml"/>
      </navPoint>`
  );
}


async function loadChapterAssets(chapter, index) {
  const openerPromise = chapter.imageUrl
    ? fetchImageForEpub(chapter.imageUrl)
        .then((imageBuffer) => ({
          imagePath: openerImageFileName(index),
          imageBuffer,
        }))
        .catch((error) => {
          console.error(`Skipping image for chapter "${chapter.title}":`, error);
          return null;
        })
    : Promise.resolve(null);

  const illustrationPromises = (chapter.illustrations ?? []).map(
    async (illustration) => {
      if (!illustration?.imageUrl) return null;

      try {
        return {
          illustration,
          imageBuffer: await fetchImageForEpub(illustration.imageUrl),
        };
      } catch (error) {
        console.error(
          `Skipping section illustration for chapter "${chapter.title}":`,
          error
        );
        return null;
      }
    }
  );

  const [opener, illustrationResults] = await Promise.all([
    openerPromise,
    Promise.all(illustrationPromises),
  ]);

  return {
    opener,
    illustrations: illustrationResults.filter(Boolean).map((result, i) => ({
      ...result.illustration,
      imagePath: imageFileName(index, i),
      imageBuffer: result.imageBuffer,
    })),
  };
}

function addChapter(
  oebps,
  chapter,
  index,
  assets,
  manifestItems,
  spineItems,
  navPoints
) {
  const fileName = chapterFileName(index);
  const itemId = `chapter-${index + 1}`;
  const openerImagePath = assets.opener?.imagePath ?? null;

  if (assets.opener) {
    oebps.file(assets.opener.imagePath, assets.opener.imageBuffer);
    manifestItems.push(
      `<item id="img-${index + 1}" href="${assets.opener.imagePath}" media-type="image/jpeg"/>`
    );
  }

  for (let i = 0; i < assets.illustrations.length; i++) {
    const illustration = assets.illustrations[i];
    oebps.file(illustration.imagePath, illustration.imageBuffer);
    manifestItems.push(
      `<item id="img-${index + 1}-${i + 1}" href="${illustration.imagePath}" media-type="image/jpeg"/>`
    );
  }

  const html = insertIllustrationsIntoHtml(chapter.html, assets.illustrations);
  const xhtml = buildChapterXhtml(chapter.title, html, openerImagePath);
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
  const id = `stitch-${Date.now()}`;

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

export async function buildEpub({ title, author, cover, storyAtlas, chapters }) {
  const zip = new JSZip();
  const sortedChapters = [...chapters].sort((a, b) => a.order - b.order);
  const manifestItems = [];
  const spineItems = [];
  const navPoints = [];

  addContainer(zip);

  const oebps = zip.folder("OEBPS");
  addStyles(oebps, manifestItems);
  await addCover(oebps, cover, manifestItems, spineItems);

  const atlasAssets = await loadStoryAtlasAssets(storyAtlas);
  addStoryAtlas(oebps, atlasAssets, manifestItems, spineItems, navPoints);

  const chapterAssets = await Promise.all(
    sortedChapters.map((chapter, index) => loadChapterAssets(chapter, index))
  );

  for (let i = 0; i < sortedChapters.length; i++) {
    addChapter(
      oebps,
      sortedChapters[i],
      i,
      chapterAssets[i],
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
