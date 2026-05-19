"use client";

import {
  CheckCircle2,
  AlertCircle,
  Circle,
  Loader2,
  MinusCircle,
} from "lucide-react";
import {
  CHAPTER_STATUS,
  STITCH_STATUS,
  PHASES,
  chapterStatusLabel,
  isTerminalPhase,
} from "@/lib/generationProgress";

function ChapterRowIcon({ status }) {
  switch (status) {
    case CHAPTER_STATUS.DONE:
      return (
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden
        />
      );
    case CHAPTER_STATUS.ERROR:
      return (
        <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
      );
    case CHAPTER_STATUS.SKIPPED:
      return (
        <MinusCircle className="h-4 w-4 shrink-0 text-muted" aria-hidden />
      );
    case CHAPTER_STATUS.PROMPT:
    case CHAPTER_STATUS.IMAGE:
      return (
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-accent"
          aria-hidden
        />
      );
    default:
      return (
        <Circle className="h-4 w-4 shrink-0 text-muted/40" aria-hidden />
      );
  }
}

function StitchRowIcon({ status }) {
  switch (status) {
    case STITCH_STATUS.DONE:
      return (
        <CheckCircle2
          className="h-4 w-4 shrink-0 text-emerald-600"
          aria-hidden
        />
      );
    case STITCH_STATUS.ERROR:
      return (
        <AlertCircle className="h-4 w-4 shrink-0 text-danger" aria-hidden />
      );
    case STITCH_STATUS.ACTIVE:
      return (
        <Loader2
          className="h-4 w-4 shrink-0 animate-spin text-accent"
          aria-hidden
        />
      );
    default:
      return (
        <Circle className="h-4 w-4 shrink-0 text-muted/40" aria-hidden />
      );
  }
}

const Loading = ({ isLoading, progress }) => {
  const show =
    isLoading || (progress && isTerminalPhase(progress.phase));
  if (!show || !progress) return null;

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
  const showChapterList = chapters.length > 0 && !isError;

  return (
    <div
      className="form-card w-full space-y-4"
      role="status"
      aria-live="polite"
      aria-busy={isLoading && !isTerminalPhase(phase)}
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
        {!isError && (
          <span className="shrink-0 text-xs tabular-nums text-muted">
            {percent}%
          </span>
        )}
      </div>

      {!isError && (
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
                <ChapterRowIcon status={chapter.status} />
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
                    {chapterStatusLabel(chapter.status)}
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
              <StitchRowIcon status={stitching.status} />
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
