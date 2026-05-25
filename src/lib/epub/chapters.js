import epub from "epubjs";

const NON_STORY_LABELS = [
  "Title",
  "Cover",
  "Dedication",
  "Contents",
  "Copyright",
  "Endorsements",
  "Introduction",
  "Author",
  "About",
  "Map",
  "Recommendations",
];

export function parseEpubFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const epubReader = epub(event.target.result);
        const metadata = await epubReader.loaded.metadata;
        const nav = await epubReader.loaded.navigation;
        resolve({ epubReader, metadata, toc: nav.toc });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
}

export function flattenToc(toc) {
  const chapters = [];

  for (const item of toc) {
    if (item.subitems?.length > 0) {
      chapters.push(...item.subitems);
    } else {
      chapters.push(item);
    }
  }

  return chapters;
}

export function isNonStoryChapter(chapterLabel) {
  return NON_STORY_LABELS.some((label) =>
    chapterLabel.toLowerCase().includes(label.toLowerCase())
  );
}

export function extractStoryChapters(chapters) {
  return chapters.filter((chapter) => !isNonStoryChapter(chapter.label));
}

export async function renderChapterHtml(chapter, epubReader) {
  const displayedChapter = await epubReader
    .renderTo("hiddenDiv")
    .display(chapter.href);

  return {
    html: displayedChapter.document.body.innerHTML,
  };
}

export function removeImages(html) {
  return html.replace(/<img[^>]+>/gi, "");
}
