import { logInfo } from "@/lib/api/logger";
import { getImageModel } from "@/lib/imageModels";
import {
  getEstimatedSectionIllustrationCount,
  getIllustrationChapterCount,
  MAX_ILLUSTRATED_CHAPTERS,
} from "@/lib/generationProgress";
import { ILLUSTRATION_MODES } from "@/lib/illustrationModes";

export function logGenerationStart({
  bookMeta,
  storyChapters,
  allChapters,
  imageStyle,
  imageModel,
  useSectionArt,
  proUnlocked,
  fullBookUnlocked,
  concurrency,
}) {
  const storyChapterCount = storyChapters.length;
  const fullBook = Boolean(fullBookUnlocked);
  const chaptersToIllustrate = getIllustrationChapterCount(
    storyChapterCount,
    fullBook
  );
  const estimatedImages = useSectionArt
    ? getEstimatedSectionIllustrationCount(storyChapterCount, fullBook)
    : chaptersToIllustrate;

  logInfo("Visualize EPUB", {
    title: bookMeta.title,
    author: bookMeta.author,
    imageStyle,
    imageModel: getImageModel(imageModel).id,
    illustrationPlacement: useSectionArt
      ? ILLUSTRATION_MODES.SECTION_ART
      : ILLUSTRATION_MODES.CHAPTER_OPENER,
    sectionArt: useSectionArt,
    proUnlocked,
    fullBook,
    storyChapterCount,
    allChapterCount: allChapters.length,
    chaptersToIllustrate,
    maxIllustratedChapters: MAX_ILLUSTRATED_CHAPTERS,
    estimatedImages,
    pipelineConcurrency: concurrency,
  });
}
