export function shouldGenerateStoryAtlas(proUnlocked, storyAtlasEnabled) {
  return Boolean(proUnlocked && storyAtlasEnabled);
}
