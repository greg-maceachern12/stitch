import epub from "epubjs";
import {
  CHAPTER_STATUS,
  createChapterProgress,
  setChapterStatus,
  setPreparing,
} from "../lib/generationProgress";
import {
  generateChapterImagePrompt,
  generateImageFromPrompt,
} from "./generation";

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

export const parseEpubFile = (file) => {
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
};

export const isNonStoryChapter = (chapterLabel) => {
  return NON_STORY_LABELS.some((label) =>
    chapterLabel.toLowerCase().includes(label.toLowerCase())
  );
};

export const flattenToc = (toc) => {
  const chapters = [];
  for (const item of toc) {
    if (item.subitems?.length > 0) {
      chapters.push(...item.subitems);
    } else {
      chapters.push(item);
    }
  }
  return chapters;
};

export const extractStoryChapters = (chapters) =>
  chapters.filter((chapter) => !isNonStoryChapter(chapter.label));

export const renderChapterHtml = async (chapter, epubReader) => {
  const displayedChapter = await epubReader
    .renderTo("hiddenDiv")
    .display(chapter.href);
  return {
    html: displayedChapter.document.body.innerHTML,
  };
};

export const removeImages = (html) => html.replace(/<img[^>]+>/gi, "");

export const injectImage = (html, imageUrl) => {
  const cleaned = removeImages(html);
  if (!imageUrl) return cleaned;
  return `<img src="${imageUrl}" alt="Chapter illustration" />\n${cleaned}`;
};

async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current], current);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

async function generateChapterImage(chapterTitle, bookTitle, onStep) {
  onStep?.("prompt");
  const imagePrompt = await generateChapterImagePrompt(bookTitle, chapterTitle);
  if (
    !imagePrompt ||
    imagePrompt === "False" ||
    imagePrompt.startsWith("Error:")
  ) {
    return null;
  }

  onStep?.("image");
  return generateImageFromPrompt(imagePrompt);
}

/**
 * Renders all chapters sequentially, then runs the AI pipeline on story chapters
 * with bounded concurrency.
 */
export const runImagePipeline = async ({
  allChapters,
  storyChapters,
  epubReader,
  bookTitle,
  concurrency = 4,
  onProgress,
}) => {
  const storyHrefs = new Set(storyChapters.map((c) => c.href));
  const storyIdByHref = new Map(
    storyChapters.map((c, i) => [c.href, c.href || `chapter-${i}`])
  );
  const rendered = [];

  let progress = createChapterProgress(bookTitle, storyChapters);
  onProgress?.(progress);

  for (let i = 0; i < allChapters.length; i++) {
    const chapter = allChapters[i];
    const { html } = await renderChapterHtml(chapter, epubReader);
    rendered.push({
      id: chapter.href || `chapter-${i}`,
      title: chapter.label,
      html,
      isStory: storyHrefs.has(chapter.href),
      order: i,
    });
    progress = setPreparing(progress, true);
    onProgress?.(progress);
  }

  const storyRendered = rendered.filter((c) => c.isStory);
  progress = setPreparing(progress, false);
  onProgress?.(progress);

  await mapWithConcurrency(storyRendered, concurrency, async (chapter) => {
    const chapterId = storyIdByHref.get(chapter.id) ?? chapter.id;

    const reportGenerating = (step) => {
      const status =
        step === "prompt" ? CHAPTER_STATUS.PROMPT : CHAPTER_STATUS.IMAGE;
      progress = setChapterStatus(progress, chapterId, status);
      onProgress?.(progress);
    };

    reportGenerating("prompt");
    try {
      chapter.imageUrl = await generateChapterImage(
        chapter.title,
        bookTitle,
        reportGenerating
      );
      progress = setChapterStatus(progress, chapterId, CHAPTER_STATUS.DONE);
    } catch (error) {
      console.error(`Image pipeline failed for "${chapter.title}":`, error);
      chapter.imageUrl = null;
      progress = setChapterStatus(progress, chapterId, CHAPTER_STATUS.ERROR);
    }
    onProgress?.(progress);
  });

  return rendered.map((chapter) => ({
    title: chapter.title,
    html: removeImages(chapter.html),
    imageUrl: chapter.imageUrl,
    order: chapter.order,
  }));
};
