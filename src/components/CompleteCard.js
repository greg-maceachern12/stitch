"use client";

import { CheckCircle2 } from "lucide-react";

export default function CompleteCard({ bookTitle, onRedownload }) {
  return (
    <div className="form-card w-full space-y-4 text-center">
      <CheckCircle2
        className="mx-auto h-10 w-10 text-emerald-600"
        aria-hidden
      />
      <h2 className="text-lg font-semibold text-foreground">
        We drew all over your book.
      </h2>
      {bookTitle && (
        <p className="truncate text-xs font-medium text-muted uppercase tracking-wider">
          {bookTitle}
        </p>
      )}
      <p className="text-sm text-muted">
        Mostly inside the margins. Your illustrated EPUB should be downloading now.
      </p>
      <p className="text-sm text-muted">
        If nothing showed up,{" "}
        <button
          type="button"
          onClick={onRedownload}
          className="text-foreground underline underline-offset-4 hover:opacity-80 font-medium"
        >
          click here to trigger it manually
        </button>
        .
      </p>
    </div>
  );
}
