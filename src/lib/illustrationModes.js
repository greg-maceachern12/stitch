export const ILLUSTRATION_MODES = {
  CHAPTER_OPENER: "chapter-opener",
  SECTION_ART: "section-art",
};

export const DEFAULT_ILLUSTRATION_MODE = ILLUSTRATION_MODES.CHAPTER_OPENER;

export function getIllustrationMode(mode) {
  return Object.values(ILLUSTRATION_MODES).includes(mode)
    ? mode
    : DEFAULT_ILLUSTRATION_MODE;
}

export function isSectionArtMode(mode) {
  return getIllustrationMode(mode) === ILLUSTRATION_MODES.SECTION_ART;
}

/** Section art is opt-in: Pro unlocked and the Section art toggle enabled. */
export function shouldUseSectionArt(proUnlocked, mode) {
  return Boolean(proUnlocked) && isSectionArtMode(mode);
}
