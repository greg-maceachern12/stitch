"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Image from "next/image";
import {
  Menu,
  X,
  Mail,
  Home,
  Info,
  Loader2,
  BookOpen,
} from "lucide-react";

const EBOOKS_URL = "https://www.ebooks.com";

const WEB3FORMS_URL = "https://api.web3forms.com/submit";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [issuesMounted, setIssuesMounted] = useState(false);
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

  const closeIssues = useCallback(() => {
    if (sending) return;
    setIssuesOpen(false);
    setEmail("");
    setBody("");
    setSent(false);
    setError(null);
  }, [sending]);

  useEffect(() => {
    setIssuesMounted(true);
  }, []);

  useEffect(() => {
    if (!issuesOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape" && !sending) {
        event.preventDefault();
        closeIssues();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [issuesOpen, sending, closeIssues]);

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
              <a
                href={EBOOKS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-pill inline-flex items-center gap-2"
              >
                <BookOpen
                  className="h-4 w-4 shrink-0 text-violet-500"
                  strokeWidth={2.25}
                  aria-hidden="true"
                />
                <span>Get EPUBs</span>
              </a>
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
              <a
                href={EBOOKS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="nav-pill block"
                onClick={closeMenu}
              >
                <span className="flex items-center gap-3">
                  <BookOpen
                    className="h-4 w-4 shrink-0 text-violet-500"
                    strokeWidth={2.25}
                    aria-hidden="true"
                  />
                  Get EPUBs
                </span>
              </a>
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

      {issuesMounted &&
        issuesOpen &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <button
              type="button"
              className="visuai-pro-modal-backdrop absolute inset-0 cursor-default bg-[#1c1917]/50 backdrop-blur-md"
              aria-label="Close issue report"
              onClick={closeIssues}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="issues-dialog-title"
              className="visuai-pro-modal-panel form-card relative z-10 w-full max-w-md shadow-[0_24px_56px_-20px_rgba(28,25,23,0.45)]"
            >
              <h2 id="issues-dialog-title" className="text-lg text-foreground">
                Report an issue
              </h2>
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
                  {error && <p className="text-xs text-red-600">{error}</p>}
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
          </div>,
          document.body
        )}
    </>
  );
};

export default Navbar;
