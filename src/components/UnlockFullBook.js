"use client";

import { useState } from "react";
import { Lock } from "lucide-react";

export default function UnlockFullBook({
  onUnlock,
  onPasscodeChange,
  error,
  disabled,
}) {
  const [passcode, setPasscode] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    onUnlock(passcode);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-2 rounded-lg border border-dashed border-border bg-background/80 px-3 py-3"
    >
      <div className="flex items-start gap-2">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden />
        <div className="min-w-0 space-y-0.5">
          <p className="text-sm font-medium text-foreground">Unlock full book</p>
          <p className="text-xs text-muted">
            Enter a passcode to illustrate every chapter, not just the first
            three.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <input
          type="password"
          value={passcode}
          onChange={(event) => {
            setPasscode(event.target.value);
            onPasscodeChange?.();
          }}
          placeholder="Passcode"
          disabled={disabled}
          autoComplete="off"
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-foreground/30 disabled:opacity-50"
          aria-label="Full book passcode"
        />
        <button
          type="submit"
          disabled={disabled || !passcode.trim()}
          className="shrink-0 rounded-md border border-border bg-hover-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-hover-surface/80 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Unlock
        </button>
      </div>
      {error && (
        <p className="text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
