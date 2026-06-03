"use client";

import { CheckCircle2, Download } from "lucide-react";

const EXTERNAL_LINK_CLASS =
  "font-medium text-foreground underline underline-offset-2 hover:text-foreground/80";

const DEVICE_GUIDES = {
  kindle: {
    label: "Kindle",
    steps: [
      <>
        Go to{" "}
        <a
          href="https://www.amazon.com/sendtokindle"
          target="_blank"
          rel="noopener noreferrer"
          className={EXTERNAL_LINK_CLASS}
        >
          amazon.com/sendtokindle
        </a>{" "}
        and sign in.
      </>,
      "Upload the EPUB from your Downloads folder.",
      "Pick your Kindle or Kindle app — it syncs in a few minutes.",
    ],
  },
  apple: {
    label: "Apple Books",
    steps: [
      "Find the EPUB in Downloads (Mac) or tap the file in your browser (iPhone/iPad).",
      "Open it — double-click on Mac, or tap Open in Books on iOS.",
      "Open the Books app; your book is under My Books.",
    ],
  },
  kobo: {
    label: "Kobo",
    steps: [
      "Connect your Kobo to your computer with a USB cable.",
      "Drag the EPUB onto the Kobo drive that appears.",
      "Eject safely — the cover shows up on your Home screen.",
    ],
  },
};

function DeviceSteps({ steps }) {
  return (
    <ol className="list-decimal list-inside space-y-1.5 text-sm leading-relaxed text-muted">
      {steps.map((step, index) => (
        <li key={typeof step === "string" ? step : `step-${index}`}>{step}</li>
      ))}
    </ol>
  );
}

export default function CompleteCard({
  bookTitle,
  cover,
  illustratedCount,
  onRedownload,
  showProUpsell = false,
  onOpenPro,
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
            Ready to read
          </p>
          <h2 className="text-lg leading-snug text-foreground">Your book is ready</h2>
          <p className="text-sm leading-relaxed text-muted">
            The illustrated EPUB is in your downloads.
          </p>
        </div>
      </div>

      {bookTitle && (
        <div className="mt-4 flex gap-4 rounded-md border border-border bg-background p-4">
          {cover && (
            <div className="h-28 w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-hover-surface shadow-sm">
              <img
                src={cover}
                alt={`Cover of ${bookTitle}`}
                className="h-full w-full object-cover"
              />
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="font-display-semibold truncate text-sm text-foreground">
              {bookTitle}
            </p>
            {chapterSummary && (
              <p className="text-xs text-muted">{chapterSummary}</p>
            )}
          </div>
        </div>
      )}

      <div className="mt-5 space-y-3">
        <p className="text-sm font-medium text-foreground">Open on Kindle</p>
        <div className="rounded-lg border border-border bg-background px-4 py-3">
          <DeviceSteps steps={DEVICE_GUIDES.kindle.steps} />
        </div>

        <details className="text-sm">
          <summary className="cursor-pointer font-medium text-foreground hover:underline">
            Other devices (Apple Books, Kobo)
          </summary>
          <div className="mt-3 space-y-4 rounded-lg border border-border bg-background px-4 py-3">
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                {DEVICE_GUIDES.apple.label}
              </h3>
              <DeviceSteps steps={DEVICE_GUIDES.apple.steps} />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-foreground">
                {DEVICE_GUIDES.kobo.label}
              </h3>
              <DeviceSteps steps={DEVICE_GUIDES.kobo.steps} />
            </div>
          </div>
        </details>
      </div>

      {showProUpsell && onOpenPro && (
        <p className="mt-5 text-sm leading-relaxed text-muted">
          This was a taste.{" "}
          <button
            type="button"
            onClick={onOpenPro}
            className="font-medium text-[var(--pro-blue)] underline-offset-2 transition-colors hover:text-[var(--pro-navy)] hover:underline"
          >
            Illustrate the whole book with Pro
          </button>
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Nothing showed up? Check your browser bar or Downloads folder.
        </p>
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
