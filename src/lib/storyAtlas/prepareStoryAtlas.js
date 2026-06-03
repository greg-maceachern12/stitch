import { buildStoryAtlasXhtml } from "@/lib/storyAtlas/atlasXhtml";
import { atlasPortraitPath } from "@/lib/storyAtlas/atlasPaths";

export function prepareStoryAtlasForEpub(plan, portraits, bookTitle) {
  if (!plan) return null;

  const characters = (plan.characters ?? []).map((character) => ({
    ...character,
    imagePath: portraits[character.id] ? atlasPortraitPath(character.id) : null,
  }));

  return {
    xhtml: buildStoryAtlasXhtml({ ...plan, characters }, bookTitle),
    characters: (plan.characters ?? []).map((character) => ({
      id: character.id,
      imageUrl: portraits[character.id] ?? null,
    })),
  };
}
