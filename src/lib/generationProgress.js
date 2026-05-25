export const MAX_ILLUSTRATED_CHAPTERS = 3;

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
  PREPARING: "preparing",
  ILLUSTRATING: "illustrating",
  STITCHING: "stitching",
  COMPLETE: "complete",
  ERROR: "error",
};

const CHAPTER_STATUS_LABEL = {
  [CHAPTER_STATUS.PENDING]: "Waiting",
  [CHAPTER_STATUS.PROMPT]: "Writing art direction",
  [CHAPTER_STATUS.IMAGE]: "Rendering illustration",
  [CHAPTER_STATUS.DONE]: "Illustrated",
  [CHAPTER_STATUS.SKIPPED]: "Skipped",
  [CHAPTER_STATUS.LOCKED]: "Locked",
  [CHAPTER_STATUS.ERROR]: "Failed",
};

const STITCH_LABEL = "Stitch book together";

export function chapterStatusLabel(status, phase) {
  if (phase === PHASES.READY && status === CHAPTER_STATUS.PENDING) {
    return "Ready";
  }
  if (status === CHAPTER_STATUS.LOCKED) {
    return "Locked";
  }
  return CHAPTER_STATUS_LABEL[status] ?? "Waiting";
}

export function getIllustrationChapterCount(chapterCount, fullBookUnlocked = false) {
  const total = Math.max(0, Number(chapterCount) || 0);
  if (fullBookUnlocked) return total;
  return Math.min(MAX_ILLUSTRATED_CHAPTERS, total);
}

export function hasLockedChapters(chapters = []) {
  return chapters.some((chapter) => chapter.status === CHAPTER_STATUS.LOCKED);
}

export function applyFullBookUnlock(progress) {
  const chapters = progress.chapters.map((chapter) =>
    chapter.status === CHAPTER_STATUS.LOCKED
      ? { ...chapter, status: CHAPTER_STATUS.PENDING }
      : chapter
  );

  return {
    ...progress,
    fullBookUnlocked: true,
    chapters,
    message:
      progress.phase === PHASES.READY
        ? "Full book unlocked — click Visualize to illustrate every chapter"
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

function readyMessage(storyChapters, fullBookUnlocked) {
  if (fullBookUnlocked || storyChapters.length <= MAX_ILLUSTRATED_CHAPTERS) {
    return "Ready — click Visualize to illustrate every chapter";
  }
  return `Ready — click Visualize to illustrate the first ${MAX_ILLUSTRATED_CHAPTERS} chapters`;
}

export function createReadyProgress(
  bookTitle,
  storyChapters,
  fullBookUnlocked = false
) {
  const chapters = buildChapterEntries(storyChapters, fullBookUnlocked);

  return {
    phase: PHASES.READY,
    bookTitle,
    fullBookUnlocked,
    isPreparing: false,
    chapters,
    stitching: { status: STITCH_STATUS.PENDING, label: STITCH_LABEL },
    message: readyMessage(storyChapters, fullBookUnlocked),
    percent: 0,
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
    ? `${chapterStatusLabel(status)} — “${truncate(active.title, 40)}”`
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
