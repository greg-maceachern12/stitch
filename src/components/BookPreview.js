"use client";

import { Loader2, X } from "lucide-react";

export function DismissButton({ onDismiss, disabled }) {
  return (
    <button
      type="button"
      onClick={onDismiss}
      disabled={disabled}
      aria-label="Remove book"
      className="absolute right-2 top-2 rounded p-1 text-muted transition-colors hover:bg-hover-surface hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
    >
      <X className="h-4 w-4" aria-hidden />
    </button>
  );
}

function MetaItem({ label, value }) {
  if (!value) return null;

  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-display truncate text-sm text-foreground">{value}</dd>
    </div>
  );
}

export function BookPreviewParsing({ onDismiss, dismissDisabled }) {
  return (
    <div
      className="relative flex items-center gap-4 rounded-md border border-border bg-background p-6 pr-10"
      role="status"
    >
      {onDismiss && (
        <DismissButton onDismiss={onDismiss} disabled={dismissDisabled} />
      )}
      <div className="h-28 w-20 shrink-0 rounded-sm border border-border bg-hover-surface" />
      <div className="flex items-center gap-3 text-sm text-muted">
        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-accent" aria-hidden />
        <span>Reading EPUB and loading cover…</span>
      </div>
    </div>
  );
}

const BookPreview = ({ book, onDismiss, dismissDisabled }) => {
  if (!book) return null;

  const { title, author, cover, chapterCount, language, publisher } = book;
  const chapterLabel =
    chapterCount === 1 ? "1 chapter" : `${chapterCount} chapters`;

  return (
    <section
      className="relative flex gap-4 rounded-md border border-border bg-background p-4 pr-10"
      aria-label="Book details"
    >
      {onDismiss && (
        <DismissButton onDismiss={onDismiss} disabled={dismissDisabled} />
      )}
      <div className="h-28 w-20 shrink-0 overflow-hidden rounded-sm border border-border bg-hover-surface shadow-sm">
        <img
          src={cover}
          alt={title ? `Cover of ${title}` : "Book cover"}
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="space-y-0.5">
          <h2 className="text-base leading-snug text-foreground">
            {title}
          </h2>
          {author && author !== "Unknown" && (
            <p className="text-sm text-muted">by {author}</p>
          )}
        </div>

        <dl className="grid gap-2 sm:grid-cols-2">
          <MetaItem label="Chapters" value={chapterLabel} />
          <MetaItem label="Language" value={language} />
          <MetaItem label="Publisher" value={publisher} />
        </dl>
      </div>
    </section>
  );
};

export default BookPreview;
