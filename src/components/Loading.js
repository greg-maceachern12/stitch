"use client";

import {
  CheckCircle2,
  AlertCircle,
  Circle,
  Loader2,
  MinusCircle,
  Sparkles,
} from "lucide-react";
import { formatIllustrationPrice } from "@/lib/imageModelPricing";
import {
  CHAPTER_STATUS,
  STITCH_STATUS,
  PHASES,
  chapterStatusLabel,
  isTerminalPhase,
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

function IllustrationCost({ price }) {
  if (!price) return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-gradient-to-r from-hover-surface/80 to-background px-3.5 py-2.5 shadow-sm">
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/8 text-accent">
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
        </span>
        <span className="text-xs font-medium text-muted">Illustration cost</span>
      </div>
      <span className="shrink-0 text-base font-semibold tabular-nums tracking-tight text-foreground">
        {price}
      </span>
    </div>
  );
}

const Loading = ({ isLoading, isParsing, progress, imageModel }) => {
  if (!shouldShowProgressPanel(progress, isLoading || isParsing)) return null;

  const {
    phase,
    message,
    percent,
    bookTitle,
    chapters = [],
    stitching,
    isPreparing,
  } = progress;
  const isError = phase === PHASES.ERROR;
  const isComplete = phase === PHASES.COMPLETE;
  const isReady = phase === PHASES.READY;
  const showChapterList = chapters.length > 0 && !isError;
  const showPercentBar = !isError && !isReady && phase !== PHASES.PARSING;
  const illustrationPrice =
    showChapterList && imageModel
      ? formatIllustrationPrice(imageModel, chapters.length)
      : null;

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
            <p className="truncate text-sm font-medium text-foreground">
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

      {showChapterList && (
        <ol className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-border bg-surface/50 p-2">
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
                    className={`truncate font-medium ${
                      chapter.status === CHAPTER_STATUS.PENDING
                        ? "text-muted"
                        : "text-foreground"
                    }`}
                  >
                    {chapter.title}
                  </p>
                  <p className="text-xs text-muted">
                    {chapterStatusLabel(chapter.status, phase)}
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
                  className={`font-medium ${
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
                        : "Runs after all chapters are illustrated")}
                </p>
              </div>
            </li>
          )}
        </ol>
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
        <div className="flex items-center gap-3 text-foreground">
          <CheckCircle2
            className="h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden
          />
          <p className="text-sm font-medium">{message}</p>
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
