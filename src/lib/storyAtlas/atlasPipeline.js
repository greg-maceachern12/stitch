import {
  ATLAS_CHARACTER_STATUS,
  ATLAS_STATUS,
  createAtlasCharacterEntries,
  setAtlasCharacterStatus,
  setAtlasPlanning,
  setAtlasPortraits,
  setAtlasSkipped,
} from "@/lib/generationProgress";
import { ATLAS_PORTRAIT_CONCURRENCY } from "@/lib/storyAtlas/constants";
import { buildCharacterPortraitPrompt } from "@/lib/storyAtlas/portraitPrompt";
import {
  generateImageFromPrompt,
  generateStoryAtlasPlan,
} from "@/lib/client/api";

async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const current = nextIndex++;
      results[current] = await fn(items[current], current);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}

/**
 * @returns {Promise<{ plan: object, portraits: Record<string, string> } | null>}
 */
export async function runStoryAtlasPipeline({
  bookIdentity,
  imageStyle,
  imageModel,
  initialProgress,
  onProgress,
}) {
  let currentProgress = setAtlasPlanning(initialProgress, "Researching & planning Story Atlas…");
  onProgress?.(currentProgress);

  let plan;
  try {
    plan = await generateStoryAtlasPlan({
      bookTitle: bookIdentity.bookTitle,
      author: bookIdentity.author,
      seriesName: bookIdentity.seriesName,
      seriesIndex: bookIdentity.seriesIndex,
      imageStyle,
    });
  } catch (error) {
    console.error("Story Atlas plan failed:", error);
    currentProgress = setAtlasSkipped(
      currentProgress,
      "Story Atlas skipped — could not build plan."
    );
    onProgress?.(currentProgress);
    return null;
  }

  const characters = plan.characters ?? [];
  currentProgress = {
    ...setAtlasPortraits(
      currentProgress,
      createAtlasCharacterEntries(characters),
      `Rendering character portraits (0/${characters.length})…`
    ),
    atlas: {
      ...currentProgress.atlas,
      status: ATLAS_STATUS.PORTRAITS,
      plan,
    },
  };
  onProgress?.(currentProgress);

  const portraits = {};

  await mapWithConcurrency(
    characters,
    ATLAS_PORTRAIT_CONCURRENCY,
    async (character) => {
      currentProgress = setAtlasCharacterStatus(
        currentProgress,
        character.id,
        ATLAS_CHARACTER_STATUS.IMAGE
      );
      onProgress?.(currentProgress);

      try {
        const prompt = buildCharacterPortraitPrompt(
          character.name,
          character.visualBrief,
          imageStyle
        );
        const imageUrl = await generateImageFromPrompt(
          prompt,
          imageStyle,
          imageModel
        );
        portraits[character.id] = imageUrl;

        currentProgress = setAtlasCharacterStatus(
          currentProgress,
          character.id,
          ATLAS_CHARACTER_STATUS.DONE
        );
      } catch (error) {
        console.error(`Portrait failed for ${character.name}:`, error);
        currentProgress = setAtlasCharacterStatus(
          currentProgress,
          character.id,
          ATLAS_CHARACTER_STATUS.ERROR
        );
      }

      const doneCount = currentProgress.atlas.characters.filter(
        (entry) =>
          entry.status === ATLAS_CHARACTER_STATUS.DONE ||
          entry.status === ATLAS_CHARACTER_STATUS.ERROR
      ).length;

      currentProgress = {
        ...currentProgress,
        message: `Rendering character portraits (${doneCount}/${characters.length})…`,
      };
      onProgress?.(currentProgress);
    }
  );

  currentProgress = {
    ...currentProgress,
    atlas: {
      ...currentProgress.atlas,
      status: ATLAS_STATUS.DONE,
    },
    message: "Story Atlas ready",
  };
  onProgress?.(currentProgress);

  return { plan, portraits };
}
