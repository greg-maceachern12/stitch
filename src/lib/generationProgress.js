import { MAX_SECTION_ILLUSTRATIONS_PER_CHAPTER } from "@/lib/epub/sectionIllustrations";
import { shouldUseSectionArt } from "@/lib/illustrationModes";
import { MAX_ATLAS_CHARACTERS } from "@/lib/storyAtlas/constants";

export const MAX_ILLUSTRATED_CHAPTERS = 3;
export { MAX_SECTION_ILLUSTRATIONS_PER_CHAPTER };

export const CHAPTER_STATUS = {
  PENDING: "pending",
  PROMPT: "prompt",
  IMAGE: "image",
  DONE: "done",
  SKIPPED: "skipped",
  LOCKED: "locked",
  ERROR: "error",
};

export const STITCH_STATUS = {
  PENDING: "pending",
  ACTIVE: "active",
  DONE: "done",
  ERROR: "error",
};

export const PHASES = {
  PARSING: "parsing",
  READY: "ready",
  ATLAS: "atlas",
  PREPARING: "preparing",
  ILLUSTRATING: "illustrating",
  STITCHING: "stitching",
  COMPLETE: "complete",
  ERROR: "error",
};
export const ATLAS_STATUS = {
  PENDING: "pending",
  PLANNING: "planning",
  PORTRAITS: "portraits",
  DONE: "done",
  SKIPPED: "skipped",
  ERROR: "error",
};

export const ATLAS_CHARACTER_STATUS = {
  PENDING: "pending",
  IMAGE: "image",
  DONE: "done",
  ERROR: "error",
};

const CHAPTER_STATUS_LABELS = {
  chapterOpener: {
    [CHAPTER_STATUS.PENDING]: "Waiting",
    [CHAPTER_STATUS.PROMPT]: "Writing chapter prompt",
    [CHAPTER_STATUS.IMAGE]: "Rendering chapter art",
    [CHAPTER_STATUS.DONE]: "Illustrated",
    [CHAPTER_STATUS.SKIPPED]: "Skipped",
    [CHAPTER_STATUS.LOCKED]: "Locked",
    [CHAPTER_STATUS.ERROR]: "Failed",
  },
  sectionArt: {
    [CHAPTER_STATUS.PENDING]: "Waiting",
    [CHAPTER_STATUS.PROMPT]: "Choosing sections",
    [CHAPTER_STATUS.IMAGE]: "Rendering section art",
    [CHAPTER_STATUS.DONE]: "Illustrated",
    [CHAPTER_STATUS.SKIPPED]: "Skipped",
    [CHAPTER_STATUS.LOCKED]: "Locked",
    [CHAPTER_STATUS.ERROR]: "Failed",
  },
};

const STITCH_LABEL = "Stitch book together";
const ATLAS_LABEL = "Story Atlas";

const ATLAS_STATUS_LABELS = {
  [ATLAS_STATUS.PLANNING]: "Planning orientation page",
  [ATLAS_STATUS.PORTRAITS]: "Rendering character portraits",
  [ATLAS_STATUS.DONE]: "Story Atlas ready",
  [ATLAS_STATUS.SKIPPED]: "Skipped",
  [ATLAS_STATUS.ERROR]: "Failed",
};

export function atlasStatusLabel(status, phase) {
  if (phase === PHASES.READY && status === ATLAS_STATUS.PENDING) {
    return "Ready";
  }
  return ATLAS_STATUS_LABELS[status] ?? "Waiting";
}

export function chapterStatusLabel(status, phase, sectionArtEnabled = false) {
  if (phase === PHASES.READY && status === CHAPTER_STATUS.PENDING) {
    return "Ready";
  }
  if (status === CHAPTER_STATUS.LOCKED) {
    return "Locked";
  }
  const labels = sectionArtEnabled
    ? CHAPTER_STATUS_LABELS.sectionArt
    : CHAPTER_STATUS_LABELS.chapterOpener;
  return labels[status] ?? "Waiting";
}

export function getIllustrationChapterCount(chapterCount, fullBookUnlocked = false) {
  const total = Math.max(0, Number(chapterCount) || 0);
  if (fullBookUnlocked) return total;
  return Math.min(MAX_ILLUSTRATED_CHAPTERS, total);
}

function sumChapterTargetCounts(chapterTargetCounts, fullBookUnlocked) {
  const counts = Array.isArray(chapterTargetCounts) ? chapterTargetCounts : [];
  const illustrated = fullBookUnlocked
    ? counts
    : counts.slice(0, MAX_ILLUSTRATED_CHAPTERS);
  return illustrated.reduce(
    (total, count) => total + Math.max(0, Number(count) || 0),
    0
  );
}

export function getEstimatedSectionIllustrationCount(
  chapterCount,
  fullBookUnlocked = false,
  chapterTargetCounts = null
) {
  if (Array.isArray(chapterTargetCounts) && chapterTargetCounts.length > 0) {
    return sumChapterTargetCounts(chapterTargetCounts, fullBookUnlocked);
  }

  return (
    getIllustrationChapterCount(chapterCount, fullBookUnlocked) *
    MAX_SECTION_ILLUSTRATIONS_PER_CHAPTER
  );
}

export function getEstimatedIllustrationImageCount({
  sectionArtEnabled = false,
  chapterCount = 0,
  fullBookUnlocked = false,
  chapterTargetCounts = null,
} = {}) {
  if (sectionArtEnabled) {
    return getEstimatedSectionIllustrationCount(
      chapterCount,
      fullBookUnlocked,
      chapterTargetCounts
    );
  }

  return getIllustrationChapterCount(chapterCount, fullBookUnlocked);
}

/** Map options-menu toggles to the generation settings that affect image count. */
export function resolveGenerationOptions({
  proUnlocked = false,
  illustrationMode,
  fullBookUnlocked = false,
  storyAtlasEnabled = false,
} = {}) {
  return {
    sectionArtEnabled: shouldUseSectionArt(proUnlocked, illustrationMode),
    fullBookUnlocked: Boolean(proUnlocked && fullBookUnlocked),
    storyAtlasEnabled: Boolean(proUnlocked && storyAtlasEnabled),
  };
}

export function getEstimatedAtlasPortraitCount(
  storyAtlasEnabled,
  characterCount = null
) {
  if (!storyAtlasEnabled) return 0;
  if (typeof characterCount === "number" && characterCount >= 0) {
    return Math.min(MAX_ATLAS_CHARACTERS, characterCount);
  }
  return MAX_ATLAS_CHARACTERS;
}

/** Total images for the current options menu + book (illustrations + atlas portraits). */
export function getEstimatedGenerationImageCount({
  proUnlocked = false,
  illustrationMode,
  fullBookUnlocked = false,
  storyAtlasEnabled = false,
  chapterCount = 0,
  chapterTargetCounts = null,
  atlasCharacterCount = null,
} = {}) {
  const resolved = resolveGenerationOptions({
    proUnlocked,
    illustrationMode,
    fullBookUnlocked,
    storyAtlasEnabled,
  });

  const illustrationImages = getEstimatedIllustrationImageCount({
    sectionArtEnabled: resolved.sectionArtEnabled,
    chapterCount,
    fullBookUnlocked: resolved.fullBookUnlocked,
    chapterTargetCounts,
  });

  const atlasImages = getEstimatedAtlasPortraitCount(
    resolved.storyAtlasEnabled,
    atlasCharacterCount
  );

  return illustrationImages + atlasImages;
}

export function hasLockedChapters(chapters = []) {
  return chapters.some((chapter) => chapter.status === CHAPTER_STATUS.LOCKED);
}

function readyMessage(storyChapters, fullBookUnlocked, sectionArtEnabled = false) {
  const placement = sectionArtEnabled ? "section art" : "a chapter illustration";
  if (fullBookUnlocked || storyChapters.length <= MAX_ILLUSTRATED_CHAPTERS) {
    return `Ready — click Visualize to add ${placement} throughout`;
  }
  return `Ready — click Visualize to add ${placement} to the first ${MAX_ILLUSTRATED_CHAPTERS} chapters`;
}

export function applyFullBookUnlock(progress, sectionArtEnabled = false) {
  const chapters = progress.chapters.map((chapter) =>
    chapter.status === CHAPTER_STATUS.LOCKED
      ? { ...chapter, status: CHAPTER_STATUS.PENDING }
      : chapter
  );

  return {
    ...progress,
    fullBookUnlocked: true,
    sectionArtEnabled,
    chapters,
    message:
      progress.phase === PHASES.READY
        ? readyMessage(
            progress.chapters,
            true,
            sectionArtEnabled ?? progress.sectionArtEnabled
          )
        : progress.message,
  };
}

export function applyFullBookLock(progress, sectionArtEnabled = false) {
  const chapters = progress.chapters.map((chapter, index) => ({
    ...chapter,
    status:
      index < MAX_ILLUSTRATED_CHAPTERS
        ? chapter.status === CHAPTER_STATUS.LOCKED
          ? CHAPTER_STATUS.PENDING
          : chapter.status
        : CHAPTER_STATUS.LOCKED,
  }));

  return {
    ...progress,
    fullBookUnlocked: false,
    sectionArtEnabled,
    chapters,
    message:
      progress.phase === PHASES.READY
        ? readyMessage(
            progress.chapters,
            false,
            sectionArtEnabled ?? progress.sectionArtEnabled
          )
        : progress.message,
  };
}

export function createParsingProgress(bookTitle = null) {
  return {
    phase: PHASES.PARSING,
    bookTitle,
    isPreparing: false,
    chapters: [],
    stitching: { status: STITCH_STATUS.PENDING, label: STITCH_LABEL },
    message: "Opening your EPUB…",
    percent: 0,
  };
}

function buildChapterEntries(storyChapters, fullBookUnlocked = false) {
  return storyChapters.map((chapter, index) => ({
    id: chapter.href || `chapter-${index}`,
    title: chapter.label,
    status:
      fullBookUnlocked || index < MAX_ILLUSTRATED_CHAPTERS
        ? CHAPTER_STATUS.PENDING
        : CHAPTER_STATUS.LOCKED,
  }));
}

export function withReadyPlacement(progress, sectionArtEnabled = false) {
  if (progress?.phase !== PHASES.READY) {
    return progress;
  }

  return {
    ...progress,
    sectionArtEnabled,
    message: readyMessage(
      progress.chapters,
      progress.fullBookUnlocked,
      sectionArtEnabled
    ),
  };
}

export function createReadyProgress(
  bookTitle,
  storyChapters,
  fullBookUnlocked = false,
  sectionArtEnabled = false,
  storyAtlasEnabled = false,
  chapterTargetCounts = null
) {
  const chapters = buildChapterEntries(storyChapters, fullBookUnlocked);

  return {
    phase: PHASES.READY,
    bookTitle,
    fullBookUnlocked,
    sectionArtEnabled,
    storyAtlasEnabled,
    chapterTargetCounts,
    isPreparing: false,
    chapters,
    atlas: storyAtlasEnabled
      ? {
          enabled: true,
          label: ATLAS_LABEL,
          status: ATLAS_STATUS.PENDING,
          characters: [],
        }
      : { enabled: false },
    stitching: { status: STITCH_STATUS.PENDING, label: STITCH_LABEL },
    message: readyMessage(storyChapters, fullBookUnlocked, sectionArtEnabled),
    percent: 0,
  };
}

export function createAtlasCharacterEntries(characters = []) {
  return characters.map((character) => ({
    id: character.id,
    name: character.name,
    status: ATLAS_CHARACTER_STATUS.PENDING,
  }));
}

export function setAtlasPlanning(progress, message) {
  return {
    ...progress,
    phase: PHASES.ATLAS,
    storyAtlasEnabled: true,
    atlas: {
      enabled: true,
      label: progress.atlas?.label ?? ATLAS_LABEL,
      status: ATLAS_STATUS.PLANNING,
      characters: progress.atlas?.characters ?? [],
    },
    message: message ?? "Planning Story Atlas…",
    percent: Math.max(progress.percent ?? 0, 2),
  };
}

export function setAtlasPortraits(progress, characters, message) {
  return {
    ...progress,
    phase: PHASES.ATLAS,
    atlas: {
      enabled: true,
      label: progress.atlas?.label ?? ATLAS_LABEL,
      status: ATLAS_STATUS.PORTRAITS,
      characters,
    },
    message: message ?? "Rendering Story Atlas portraits…",
    percent: Math.max(progress.percent ?? 0, 8),
  };
}

export function setAtlasCharacterStatus(progress, characterId, status) {
  const characters = (progress.atlas?.characters ?? []).map((entry) =>
    entry.id === characterId ? { ...entry, status } : entry
  );

  return {
    ...progress,
    atlas: {
      ...progress.atlas,
      enabled: true,
      label: progress.atlas?.label ?? ATLAS_LABEL,
      characters,
    },
  };
}

export function setAtlasSkipped(progress, message) {
  return {
    ...progress,
    storyAtlasEnabled: false,
    atlas: {
      enabled: true,
      label: progress.atlas?.label ?? ATLAS_LABEL,
      status: ATLAS_STATUS.SKIPPED,
      characters: progress.atlas?.characters ?? [],
    },
    message: message ?? "Story Atlas skipped",
  };
}

export function createChapterProgress(
  bookTitle,
  storyChapters,
  fullBookUnlocked = false
) {
  const chapters = buildChapterEntries(storyChapters, fullBookUnlocked);

  return {
    phase: PHASES.ILLUSTRATING,
    bookTitle,
    fullBookUnlocked,
    isPreparing: true,
    chapters,
    stitching: { status: STITCH_STATUS.PENDING, label: STITCH_LABEL },
    message: "Preparing chapters…",
    percent: computePercent(
      chapters,
      STITCH_STATUS.PENDING,
      true,
      PHASES.ILLUSTRATING
    ),
  };
}

export function setPreparing(progress, isPreparing, message) {
  return {
    ...progress,
    phase: PHASES.ILLUSTRATING,
    isPreparing,
    message: message ?? (isPreparing ? "Preparing chapters…" : progress.message),
    percent: computePercent(
      progress.chapters,
      progress.stitching.status,
      isPreparing,
      PHASES.ILLUSTRATING
    ),
  };
}

export function setChapterStatus(progress, chapterId, status) {
  const chapters = progress.chapters.map((chapter) =>
    chapter.id === chapterId ? { ...chapter, status } : chapter
  );

  const active = chapters.find((c) => c.status === status && c.id === chapterId);
  const message = active
    ? `${chapterStatusLabel(status, progress.phase, progress.sectionArtEnabled)} — “${truncate(active.title, 40)}”`
    : progress.message;

  return {
    ...progress,
    phase: PHASES.ILLUSTRATING,
    isPreparing: false,
    chapters,
    message,
    percent: computePercent(
      chapters,
      progress.stitching.status,
      false,
      PHASES.ILLUSTRATING
    ),
  };
}

export function setStitchingProgress(progress, status, detail) {
  const stitching = {
    ...progress.stitching,
    status,
    detail: detail ?? progress.stitching.detail,
  };

  const messages = {
    [STITCH_STATUS.ACTIVE]: detail || "Stitching your illustrated book…",
    [STITCH_STATUS.DONE]: "Download started",
    [STITCH_STATUS.ERROR]: detail || "Stitching failed",
  };

  return {
    ...progress,
    phase:
      status === STITCH_STATUS.DONE
        ? PHASES.COMPLETE
        : status === STITCH_STATUS.ERROR
          ? PHASES.ERROR
          : PHASES.STITCHING,
    isPreparing: false,
    stitching,
    message: messages[status] ?? progress.message,
    percent: computePercent(
      progress.chapters,
      status,
      false,
      progress.phase === PHASES.READY ? PHASES.ILLUSTRATING : progress.phase
    ),
  };
}

export function createErrorProgress(message, prior = null) {
  return {
    ...(prior ?? createParsingProgress()),
    phase: PHASES.ERROR,
    message,
    percent: 0,
    stitching: {
      ...(prior?.stitching ?? { label: STITCH_LABEL }),
      status: STITCH_STATUS.ERROR,
    },
  };
}

export function createCompleteProgress(bookTitle, prior) {
  return setStitchingProgress(
    { ...prior, bookTitle: bookTitle ?? prior?.bookTitle },
    STITCH_STATUS.DONE,
    "Your illustrated book is ready!"
  );
}

export function isTerminalPhase(phase) {
  return phase === PHASES.COMPLETE || phase === PHASES.ERROR;
}

export function shouldShowProgressPanel(progress, isLoading) {
  if (!progress) return false;
  return (
    isLoading ||
    progress.phase === PHASES.READY ||
    progress.phase === PHASES.PARSING ||
    isTerminalPhase(progress.phase)
  );
}

export function canStartVisualization(progress, isParsing) {
  return !isParsing && progress?.phase === PHASES.READY;
}

function computePercent(chapters, stitchStatus, isPreparing, phase) {
  if (phase === PHASES.READY) return 0;
  const activeChapters = chapters.filter(
    (c) => c.status !== CHAPTER_STATUS.LOCKED
  );
  if (!activeChapters.length) return isPreparing ? 5 : 0;

  const total = activeChapters.length;
  const done = activeChapters.filter(
    (c) =>
      c.status === CHAPTER_STATUS.DONE ||
      c.status === CHAPTER_STATUS.SKIPPED ||
      c.status === CHAPTER_STATUS.ERROR
  ).length;

  const inFlight = activeChapters.filter(
    (c) =>
      c.status === CHAPTER_STATUS.PROMPT || c.status === CHAPTER_STATUS.IMAGE
  ).length;

  let chapterFraction = done / total;
  if (inFlight > 0) {
    chapterFraction += (inFlight / total) * 0.35;
  }
  if (isPreparing) {
    chapterFraction = Math.min(chapterFraction, 0.08);
    return Math.round(chapterFraction * 85);
  }

  const chapterShare = chapterFraction * 0.88;

  if (stitchStatus === STITCH_STATUS.PENDING) {
    return Math.round(chapterShare * 100);
  }
  if (stitchStatus === STITCH_STATUS.ACTIVE) {
    return Math.round(88 + 10 * 0.5);
  }
  if (stitchStatus === STITCH_STATUS.DONE) {
    return 100;
  }
  return Math.round(chapterShare * 100);
}

function truncate(str, max) {
  if (!str || str.length <= max) return str;
  return `${str.slice(0, max - 1)}…`;
}
