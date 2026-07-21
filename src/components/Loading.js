"use client";

import {
  CheckCircle2,
  AlertCircle,
  BookMarked,
  Circle,
  Loader2,
  Lock,
  MinusCircle,
  Sparkles,
} from "lucide-react";
import { formatIllustrationPrice } from "@/lib/imageModelPricing";
import { DEFAULT_IMAGE_MODEL, getImageModel } from "@/lib/imageModels";
import {
  ATLAS_CHARACTER_STATUS,
  ATLAS_STATUS,
  CHAPTER_STATUS,
  STITCH_STATUS,
  PHASES,
  atlasStatusLabel,
  chapterStatusLabel,
  formatEstimatedTimeRemaining,
  getEstimatedGenerationImageCount,
  getRemainingGenerationImageCount,
  hasLockedChapters,
  isTerminalPhase,
  MAX_ILLUSTRATED_CHAPTERS,
  resolveGenerationOptions,
  shouldShowProgressPanel,
} from "@/lib/generationProgress";

function StatusIcon({ status }) {
  if (status === CHAPTER_STATUS.DONE || status === STITCH_STATUS.DONE) {
    return (
      <CheckCircle2
        className="h-4 w-4 shrink-0 text-emerald-600"
        aria-hidden
      />
    );
  }

  if (status === CHAPTER_STATUS.ERROR || status === STITCH_STATUS.ERROR) {
    return (
      <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
    );
  }

  if (status === CHAPTER_STATUS.SKIPPED) {
    return (
      <MinusCircle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
    );
  }

  if (status === CHAPTER_STATUS.LOCKED) {
    return (
      <Lock className="h-4 w-4 shrink-0 text-[var(--locked)]" aria-hidden />
    );
  }

  if (
    status === CHAPTER_STATUS.PROMPT ||
    status === CHAPTER_STATUS.IMAGE ||
    status === STITCH_STATUS.ACTIVE
  ) {
    return (
      <Loader2
        className="h-4 w-4 shrink-0 animate-spin text-accent"
        aria-hidden
      />
    );
  }

  return <Circle className="h-4 w-4 shrink-0 text-muted/40" aria-hidden />;
}

function atlasCharacterStatusLabel(status) {
  if (status === ATLAS_CHARACTER_STATUS.IMAGE) return "Rendering portrait";
  if (status === ATLAS_CHARACTER_STATUS.DONE) return "Portrait ready";
  if (status === ATLAS_CHARACTER_STATUS.ERROR) return "Failed";
  return "Waiting";
}

function StoryAtlasListItems({ atlas, phase }) {
  const isActive =
    atlas.status === ATLAS_STATUS.PLANNING ||
    atlas.status === ATLAS_STATUS.PORTRAITS;
  const isReady =
    phase === PHASES.READY && atlas.status === ATLAS_STATUS.PENDING;
  const characters = atlas.characters ?? [];

  return (
    <>
      <li
        className={`flex items-start gap-3 rounded-md border px-2 py-2 text-sm transition-colors ${
          isActive
            ? "border-[var(--pro-blue)]/35 bg-[var(--pro-blue)]/[0.05] ring-1 ring-[var(--pro-blue)]/15"
            : "border-[var(--pro-border)]"
        }`}
        style={
          isActive ? undefined : { background: "var(--pro-gradient-soft)" }
        }
      >
        <BookMarked
          className="h-4 w-4 shrink-0 text-[var(--pro-blue)]"
          strokeWidth={1.75}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 items-center gap-2">
            <p
              className={`font-display truncate ${
                isReady ? "text-muted" : "text-[var(--pro-navy)]"
              }`}
            >
              {atlas.label ?? "Story Atlas"}
            </p>
            <span className="shrink-0 rounded-full border border-[var(--pro-blue)]/25 bg-[var(--pro-blue)]/5 px-1.5 py-px text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--pro-blue)]">
              Pro
            </span>
          </div>
          <p className="text-xs text-muted">
            {atlasStatusLabel(atlas.status, phase)}
          </p>
        </div>
      </li>

      {characters.map((character) => {
        const isCharacterActive =
          character.status === ATLAS_CHARACTER_STATUS.IMAGE;
        return (
          <li
            key={character.id}
            className={`flex items-start gap-3 rounded-md py-2 pl-9 pr-2 text-sm transition-colors ${
              isCharacterActive ? "bg-[var(--pro-blue)]/[0.06]" : ""
            }`}
          >
            <StatusIcon status={character.status} />
            <div className="min-w-0 flex-1">
              <p
                className={`font-display truncate ${
                  character.status === ATLAS_CHARACTER_STATUS.PENDING
                    ? "text-muted"
                    : "text-foreground"
                }`}
              >
                {character.name}
              </p>
              <p className="text-xs text-muted">
                {atlasCharacterStatusLabel(character.status)}
              </p>
            </div>
          </li>
        );
      })}
    </>
  );
}

function ChapterLimitBanner({ onOpenPro }) {
  return (
    <p
      className="rounded-md border border-[var(--locked)]/30 bg-[var(--locked)]/[0.07] px-2.5 py-1.5 text-center text-[11px] font-medium leading-snug text-[var(--locked)]"
      role="status"
    >
      Only the first {MAX_ILLUSTRATED_CHAPTERS} chapters will be illustrated.
      {onOpenPro ? (
        <>
          {" "}
          To unlock the full book,{" "}
          <button
            type="button"
            onClick={onOpenPro}
            className="font-medium underline underline-offset-2 transition-colors hover:text-[var(--pro-navy)]"
          >
            go Pro
          </button>
        </>
      ) : null}
    </p>
  );
}

function IllustrationCost({ price }) {
  if (!price) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-gradient-to-r from-hover-surface/80 to-background px-3.5 py-2.5 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/8 text-accent">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="font-display text-xs text-muted">Estimated art cost</span>
      </div>
      <span className="font-display-semibold shrink-0 text-base tabular-nums text-foreground">
        {price}
      </span>
    </div>
  );
}

function TimeRemaining({ label, value }) {
  if (!value) return null;

  return (
    <div className="flex items-center justify-between gap-3 px-0.5">
      <span className="font-display text-xs text-muted">{label}</span>
      <span className="shrink-0 text-xs tabular-nums text-foreground">{value}</span>
    </div>
  );
}

const Loading = ({
  isLoading,
  isParsing,
  progress,
  imageModel,
  illustrationMode,
  proUnlocked = false,
  fullBookUnlocked = false,
  storyAtlasEnabled = false,
  onOpenPro,
}) => {
  if (!shouldShowProgressPanel(progress, isLoading || isParsing)) return null;

  const {
    phase,
    message,
    percent,
    bookTitle,
    chapters = [],
    stitching,
    atlas,
    isPreparing,
    chapterTargetCounts,
  } = progress;
  const { sectionArtEnabled, fullBookUnlocked: effectiveFullBook } =
    resolveGenerationOptions({
      proUnlocked,
      illustrationMode,
      fullBookUnlocked,
      storyAtlasEnabled,
    });
  const pricedImageModel = getImageModel(
    proUnlocked ? imageModel : DEFAULT_IMAGE_MODEL
  ).id;
  const isError = phase === PHASES.ERROR;
  const isComplete = phase === PHASES.COMPLETE;
  const isReady = phase === PHASES.READY;
  const showChapterList = chapters.length > 0 && !isError;
  const showAtlasRow = atlas?.enabled && showChapterList;
  const showChapterLimitBanner =
    showChapterList && hasLockedChapters(chapters);
  const showPercentBar = !isError && !isReady && phase !== PHASES.PARSING;
  const illustrationPrice =
    showChapterList
      ? formatIllustrationPrice(
          pricedImageModel,
          getEstimatedGenerationImageCount({
            proUnlocked,
            illustrationMode,
            fullBookUnlocked,
            storyAtlasEnabled,
            chapterCount: chapters.length,
            chapterTargetCounts,
            atlasCharacterCount:
              atlas?.characters?.length > 0 ? atlas.characters.length : null,
          })
        )
      : null;
  const remainingImages =
    showChapterList && !isError && !isComplete
      ? getRemainingGenerationImageCount(progress, {
          proUnlocked,
          illustrationMode,
          fullBookUnlocked,
          storyAtlasEnabled,
        })
      : 0;
  const timeRemainingLabel = formatEstimatedTimeRemaining(remainingImages);
  const timeRemainingTitle = isReady ? "Est. time" : "Time remaining";

  return (
    <div
      className="form-card w-full space-y-4"
      role="status"
      aria-live="polite"
      aria-busy={(isLoading || isParsing) && !isTerminalPhase(phase)}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          {bookTitle && (
            <p className="font-display-semibold truncate text-lg leading-snug text-foreground">
              {bookTitle}
            </p>
          )}
          <p className="text-xs text-muted">{message}</p>
        </div>
        {showPercentBar && (
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {percent}%
          </span>
        )}
      </div>

      {showPercentBar && (
        <div className="h-1 overflow-hidden rounded-full bg-hover-surface">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {timeRemainingLabel && (
        <TimeRemaining label={timeRemainingTitle} value={timeRemainingLabel} />
      )}

      {showChapterList && (
        <div className="space-y-2">
          {showChapterLimitBanner && (
            <ChapterLimitBanner onOpenPro={onOpenPro} />
          )}
          <ol className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-surface/50 p-2">
          {showAtlasRow && (
            <StoryAtlasListItems atlas={atlas} phase={phase} />
          )}
          {isPreparing && (
            <li className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted">
              <Loader2
                className="h-4 w-4 shrink-0 animate-spin text-accent"
                aria-hidden
              />
              <span>Preparing chapters…</span>
            </li>
          )}

          {chapters.map((chapter) => {
            const isActive =
              chapter.status === CHAPTER_STATUS.PROMPT ||
              chapter.status === CHAPTER_STATUS.IMAGE;
            return (
              <li
                key={chapter.id}
                className={`flex items-start gap-3 rounded-md px-2 py-2 text-sm transition-colors ${
                  isActive ? "bg-accent/8" : ""
                }`}
              >
                <StatusIcon status={chapter.status} />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-display truncate ${
                      chapter.status === CHAPTER_STATUS.PENDING ||
                      chapter.status === CHAPTER_STATUS.LOCKED
                        ? "text-muted"
                        : "text-foreground"
                    }`}
                  >
                    {chapter.title}
                  </p>
                  <p className="text-xs text-muted">
                    {chapterStatusLabel(chapter.status, phase, sectionArtEnabled)}
                  </p>
                </div>
              </li>
            );
          })}

          {stitching && (
            <li
              className={`mt-1 flex items-start gap-3 rounded-md border-t border-border px-2 pt-3 text-sm ${
                stitching.status === STITCH_STATUS.ACTIVE
                  ? "bg-accent/8"
                  : ""
              }`}
            >
              <StatusIcon status={stitching.status} />
              <div className="min-w-0 flex-1">
                <p
                  className={`font-display ${
                    stitching.status === STITCH_STATUS.PENDING
                      ? "text-muted"
                      : "text-foreground"
                  }`}
                >
                  {stitching.label}
                </p>
                <p className="text-xs text-muted">
                  {stitching.detail ??
                    (stitching.status === STITCH_STATUS.DONE
                      ? "EPUB assembled and download started"
                      : stitching.status === STITCH_STATUS.ACTIVE
                        ? "Assembling EPUB and packaging download"
                        : effectiveFullBook
                          ? sectionArtEnabled
                            ? "Runs after all section art is placed"
                            : "Runs after all chapter art is placed"
                          : sectionArtEnabled
                            ? "Runs after section art is placed in the first three chapters"
                            : "Runs after chapter art is placed in the first three chapters")}
                </p>
              </div>
            </li>
          )}
          </ol>
        </div>
      )}

      {showChapterList && illustrationPrice && (
        <IllustrationCost price={illustrationPrice} />
      )}

      {phase === PHASES.PARSING && !showChapterList && !isError && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface/50 px-3 py-4 text-sm text-muted">
          <Loader2
            className="h-4 w-4 shrink-0 animate-spin text-accent"
            aria-hidden
          />
          <span>Reading EPUB…</span>
        </div>
      )}

      {isComplete && !showChapterList && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-emerald-600/5 px-3.5 py-3">
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <div className="min-w-0 space-y-0.5">
            <p className="font-display-semibold text-sm text-foreground">Complete</p>
            <p className="text-xs text-muted">{message}</p>
          </div>
        </div>
      )}

      {isError && (
        <div className="flex items-start gap-3 text-danger">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
          <p className="text-sm">{message}</p>
        </div>
      )}
    </div>
  );
};

export default Loading;
