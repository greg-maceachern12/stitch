import { renderChapterHtml } from "./chapters";
import { prepareChapterForSectionIllustrations } from "./sectionIllustrations";

/**
 * Renders each story chapter and applies the same section-art heuristic used
 * during illustration (whole-chapter word count + candidate cap).
 *
 * @returns {Promise<number[]>} target illustration count per story chapter
 */
export async function estimateStoryChapterTargetCounts(epubReader, storyChapters) {
  const targetCounts = [];

  for (let i = 0; i < storyChapters.length; i++) {
    try {
      const { html } = await renderChapterHtml(storyChapters[i], epubReader);
      const prepared = prepareChapterForSectionIllustrations(html, i);
      targetCounts.push(prepared.targetCount);
    } catch (error) {
      console.error(
        `Failed to estimate illustrations for "${storyChapters[i]?.label}":`,
        error
      );
      targetCounts.push(0);
    }
  }

  return targetCounts;
}
