"use client";

import { useState } from "react";

function AccessCode({ onAccessGranted }) {
  const [accessCode, setAccessCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (accessCode === "fullbook") {
      onAccessGranted();
    } else {
      setError("Invalid access code. Please try again.");
    }
  };

  return (
    <div className="form-card w-full space-y-6">
      <header className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Enter access code
        </h2>
        <p className="text-sm text-muted">
          Full-book generation requires a code.{" "}
          <a
            href="mailto:gregmaceachern98@gmail.com?subject=Access%20Code%20For%20Pro&body=Please%20grant%20me%20access%20to%20Visuai%20Pro"
            className="underline underline-offset-4 hover:text-foreground"
          >
            Request access
          </a>
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="access-code" className="block text-sm font-medium text-foreground">
            Code
          </label>
          <input
            id="access-code"
            type="password"
            value={accessCode}
            onChange={(e) => {
              setAccessCode(e.target.value);
              setError("");
            }}
            placeholder="Enter your code"
            className="w-full rounded-md border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted/70 focus:border-foreground/30"
            autoComplete="off"
          />
          {error && (
            <p className="text-sm text-danger" role="alert">
              {error}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary">
          Continue
        </button>
      </form>
    </div>
  );
}

export default AccessCode;
