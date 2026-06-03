export function atlasPortraitPath(characterId) {
  return `images/atlas-${String(characterId).replace(/[^a-z0-9-]/gi, "-")}.jpg`;
}
