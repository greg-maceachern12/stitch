import {
  CHAPTER_STATUS,
  MAX_ILLUSTRATED_CHAPTERS,
  createChapterProgress,
  setChapterStatus,
  setPreparing,
} from "@/lib/generationProgress";
import {
  generateChapterImagePrompt,
  generateImageFromPrompt,
} from "@/lib/client/api";
import { getImageModel } from "@/lib/imageModels";
import { removeImages, renderChapterHtml } from "./chapters";

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

async function generateChapterImage(
  chapterTitle,
  bookTitle,
  onStep,
  imageStyle,
  imageModel
) {
  onStep?.("prompt");
  const imagePrompt = await generateChapterImagePrompt(
    bookTitle,
    chapterTitle,
    imageStyle
  );

  if (
    !imagePrompt ||
    imagePrompt === "False" ||
    imagePrompt.startsWith("Error:")
  ) {
    return null;
  }

  onStep?.("image");
  return generateImageFromPrompt(imagePrompt, imageStyle, imageModel);
}

export async function runImagePipeline({
  allChapters,
  storyChapters,
  epubReader,
  bookTitle,
  concurrency = 4,
  imageStyle,
  imageModel,
  initialProgress,
  onProgress,
}) {
  const resolvedImageModel = getImageModel(imageModel).id;
  const storyHrefs = new Set(storyChapters.map((chapter) => chapter.href));
  const storyIdByHref = new Map(
    storyChapters.map((chapter, index) => [
      chapter.href,
      chapter.href || `chapter-${index}`,
    ])
  );
  const rendered = [];

  let progress =
    initialProgress ?? createChapterProgress(bookTitle, storyChapters);
  if (initialProgress) {
    progress = setPreparing(progress, true);
    onProgress?.(progress);
  } else {
    onProgress?.(progress);
  }

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

  const storyRendered = rendered.filter((chapter) => chapter.isStory);
  const fullBookUnlocked = Boolean(initialProgress?.fullBookUnlocked);
  const chaptersToIllustrate = fullBookUnlocked
    ? storyRendered
    : storyRendered.slice(0, MAX_ILLUSTRATED_CHAPTERS);
  progress = setPreparing(progress, false);
  onProgress?.(progress);

  await mapWithConcurrency(chaptersToIllustrate, concurrency, async (chapter) => {
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
        reportGenerating,
        imageStyle,
        resolvedImageModel
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
}
