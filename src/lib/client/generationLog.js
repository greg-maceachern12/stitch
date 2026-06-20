import { logInfo } from "@/lib/api/logger";
import { getImageModel } from "@/lib/imageModels";
import {
  getEstimatedGenerationImageCount,
  getIllustrationChapterCount,
  MAX_ILLUSTRATED_CHAPTERS,
  resolveGenerationOptions,
} from "@/lib/generationProgress";
import { ILLUSTRATION_MODES } from "@/lib/illustrationModes";

export function logGenerationStart({
  bookMeta,
  storyChapters,
  allChapters,
  imageStyle,
  imageModel,
  illustrationMode,
  useSectionArt,
  proUnlocked,
  fullBookUnlocked,
  storyAtlasEnabled = false,
  concurrency,
  chapterTargetCounts = null,
}) {
  const storyChapterCount = storyChapters.length;
  const resolved = resolveGenerationOptions({
    proUnlocked,
    illustrationMode,
    fullBookUnlocked,
    storyAtlasEnabled,
  });
  const chaptersToIllustrate = getIllustrationChapterCount(
    storyChapterCount,
    resolved.fullBookUnlocked
  );
  const estimatedImages = getEstimatedGenerationImageCount({
    proUnlocked,
    illustrationMode,
    fullBookUnlocked,
    storyAtlasEnabled,
    chapterCount: storyChapterCount,
    chapterTargetCounts,
  });

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
    fullBook: resolved.fullBookUnlocked,
    storyAtlasEnabled: resolved.storyAtlasEnabled,
    storyChapterCount,
    allChapterCount: allChapters.length,
    chaptersToIllustrate,
    maxIllustratedChapters: MAX_ILLUSTRATED_CHAPTERS,
    estimatedImages,
    pipelineConcurrency: concurrency,
  });
}
