"use client";

import { CheckCircle2, Download } from "lucide-react";

export default function CompleteCard({
  bookTitle,
  illustratedCount,
  onRedownload,
}) {
  const chapterSummary =
    illustratedCount != null && illustratedCount > 0
      ? `${illustratedCount} chapter${illustratedCount === 1 ? "" : "s"} illustrated`
      : null;

  return (
    <div className="form-card w-full">
      <div className="flex items-start gap-4">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-600/10"
          aria-hidden
        >
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-700">
            Illustration complete
          </p>
          <h2 className="text-lg font-semibold leading-snug text-foreground">
            We drew all over your book.
          </h2>
          <p className="text-sm leading-relaxed text-muted">
            Mostly inside the margins. Your illustrated EPUB is ready.
          </p>
        </div>
      </div>

      {bookTitle && (
        <div className="mt-5 rounded-lg border border-border bg-background px-4 py-3">
          <dl className="min-w-0 space-y-2">
            <div>
              <dt className="text-xs text-muted">Book</dt>
              <dd className="truncate text-sm font-medium text-foreground">
                {bookTitle}
              </dd>
            </div>
            {chapterSummary && (
              <div>
                <dt className="sr-only">Summary</dt>
                <dd className="text-xs text-muted">{chapterSummary}</dd>
              </div>
            )}
          </dl>
        </div>
      )}

      <div className="mt-5 flex gap-3 rounded-lg border border-border bg-hover-surface/50 px-4 py-3.5">
        <Download
          className="mt-0.5 h-4 w-4 shrink-0 text-muted"
          aria-hidden
        />
        <p className="text-sm leading-relaxed text-muted">
          Your download should have started automatically. Check your browser
          or downloads folder for the illustrated EPUB.
        </p>
      </div>

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">Didn&apos;t get a file?</p>
        <button
          type="button"
          onClick={onRedownload}
          className="btn-ghost w-full shrink-0 sm:w-auto"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download again
        </button>
      </div>
    </div>
  );
}
