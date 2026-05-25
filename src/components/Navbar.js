"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, Mail, Home, Info, Loader2 } from "lucide-react";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  const openIssues = () => {
    closeMenu();
    setIssuesOpen(true);
    setSent(false);
    setError(null);
  };

  const closeIssues = () => {
    if (sending) return;
    setIssuesOpen(false);
    setEmail("");
    setBody("");
    setSent(false);
    setError(null);
  };

  const submitIssues = async (event) => {
    event.preventDefault();
    const accessKey = process.env.NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY?.trim();
    const trimmedEmail = email.trim();
    const trimmedBody = body.trim();

    if (!accessKey) {
      setError("Feedback is not configured");
      return;
    }
    if (!trimmedEmail || !trimmedBody) {
      setError("Email and message are required");
      return;
    }

    setSending(true);
    setError(null);

    try {
      const response = await fetch(WEB3FORMS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          email: trimmedEmail,
          subject: "Visuai — issue report",
          from_name: "Visuai issues",
          message: [
            trimmedBody,
            "",
            `Page: ${window.location.href}`,
            `Time: ${new Date().toISOString()}`,
          ].join("\n"),
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send");
      }
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-border bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <Image
                src="/logo_trans.png"
                alt="Visuai Logo"
                width={40}
                height={40}
                className="h-10 w-10"
              />
              <span className="font-display-semibold text-base text-foreground">Visuai</span>
            </Link>

            <div className="hidden items-center gap-1 md:flex">
              <Link href="/" className="nav-pill">
                Home
              </Link>
              <Link href="/about" className="nav-pill">
                About
              </Link>
              <button
                type="button"
                onClick={openIssues}
                className="nav-pill inline-flex items-center gap-2"
              >
                <Mail className="h-4 w-4" />
                <span>Issues?</span>
              </button>
            </div>

            <button
              type="button"
              onClick={toggleMenu}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted hover:bg-hover-surface hover:text-foreground md:hidden"
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="border-t border-border bg-surface md:hidden">
            <div className="space-y-1 px-2 py-2">
              <Link href="/" className="nav-pill block" onClick={closeMenu}>
                <span className="flex items-center gap-3">
                  <Home className="h-4 w-4" />
                  Home
                </span>
              </Link>
              <Link href="/about" className="nav-pill block" onClick={closeMenu}>
                <span className="flex items-center gap-3">
                  <Info className="h-4 w-4" />
                  About
                </span>
              </Link>
              <button
                type="button"
                className="nav-pill block w-full text-left"
                onClick={openIssues}
              >
                <span className="flex items-center gap-3">
                  <Mail className="h-4 w-4" />
                  Issues?
                </span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {issuesOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-foreground/30 p-4">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="Close"
            onClick={closeIssues}
          />
          <div className="form-card relative z-10 w-full max-w-md">
            <h2 className="text-lg text-foreground">Report an issue</h2>
            <p className="mt-1 text-sm text-muted">
              What broke? We&apos;ll reply by email.
            </p>

            {sent ? (
              <p className="mt-4 text-sm text-foreground">Thanks — message sent.</p>
            ) : (
              <form onSubmit={submitIssues} className="mt-4 space-y-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  disabled={sending}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="What happened?"
                  required
                  rows={5}
                  disabled={sending}
                  className="w-full resize-y rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                {error && (
                  <p className="text-xs text-red-600">{error}</p>
                )}
                <button type="submit" disabled={sending} className="btn-primary">
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    "Send"
                  )}
                </button>
              </form>
            )}

            <button
              type="button"
              onClick={closeIssues}
              disabled={sending}
              className="mt-3 w-full text-center text-xs text-muted hover:text-foreground"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
