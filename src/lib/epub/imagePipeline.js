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
  selectIllustrationSections,
} from "@/lib/client/api";
import { getImageModel } from "@/lib/imageModels";
import { removeImages, renderChapterHtml } from "./chapters";
import { prepareChapterForSectionIllustrations } from "./sectionIllustrations";

const SECTION_ART_IMAGE_CONCURRENCY = 2;

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

async function generateChapterIllustrations({
  chapter,
  bookTitle,
  onStep,
  imageStyle,
  imageModel,
  concurrency = SECTION_ART_IMAGE_CONCURRENCY,
}) {
  if (!chapter.targetCount || chapter.selectionCandidates.length === 0) {
    return [];
  }

  onStep?.("prompt");
  const selections = await selectIllustrationSections({
    bookTitle,
    chapterTitle: chapter.title,
    imageStyle,
    targetCount: chapter.targetCount,
    candidates: chapter.selectionCandidates,
  });

  if (!selections.length) {
    return [];
  }

  onStep?.("image");

  const results = await mapWithConcurrency(
    selections,
    concurrency,
    async (selection) => {
      try {
        const imageUrl = await generateImageFromPrompt(
          selection.prompt,
          imageStyle,
          imageModel
        );

        return {
          ...selection,
          imageUrl,
        };
      } catch (error) {
        console.error(
          `Section illustration failed for "${chapter.title}" at ${selection.anchorId}:`,
          error
        );
        return null;
      }
    }
  );

  const illustrations = results.filter(Boolean);
  if (illustrations.length === 0) {
    throw new Error(
      `All section illustrations failed for chapter "${chapter.title}"`
    );
  }

  return illustrations;
}

async function generateChapterOpenerImage({
  chapterTitle,
  bookTitle,
  onStep,
  imageStyle,
  imageModel,
}) {
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
  useSectionArt = false,
  initialProgress,
  onProgress,
}) {
  const resolvedImageModel = getImageModel(imageModel).id;
  const sectionArtEnabled = useSectionArt === true;
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
    const prepared = sectionArtEnabled
      ? prepareChapterForSectionIllustrations(html, i)
      : { html: removeImages(html), selectionCandidates: [], targetCount: 0 };

    rendered.push({
      id: chapter.href || `chapter-${i}`,
      title: chapter.label,
      html: prepared.html,
      selectionCandidates: prepared.selectionCandidates,
      targetCount: prepared.targetCount,
      illustrations: [],
      imageUrl: null,
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
      if (sectionArtEnabled) {
        chapter.illustrations = await generateChapterIllustrations({
          chapter,
          bookTitle,
          onStep: reportGenerating,
          imageStyle,
          imageModel: resolvedImageModel,
          concurrency: Math.min(concurrency, SECTION_ART_IMAGE_CONCURRENCY),
        });
      } else {
        chapter.imageUrl = await generateChapterOpenerImage({
          chapterTitle: chapter.title,
          bookTitle,
          onStep: reportGenerating,
          imageStyle,
          imageModel: resolvedImageModel,
        });
      }
      progress = setChapterStatus(progress, chapterId, CHAPTER_STATUS.DONE);
    } catch (error) {
      console.error(`Image pipeline failed for "${chapter.title}":`, error);
      chapter.illustrations = [];
      chapter.imageUrl = null;
      progress = setChapterStatus(progress, chapterId, CHAPTER_STATUS.ERROR);
    }

    onProgress?.(progress);
  });

  return rendered.map((chapter) => ({
    title: chapter.title,
    html: chapter.html,
    illustrations: chapter.illustrations ?? [],
    imageUrl: chapter.imageUrl,
    order: chapter.order,
  }));
}
