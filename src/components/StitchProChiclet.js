"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import { requestProAccess } from "@/lib/client/proAccessRequest";
import { PRO_FEATURES } from "@/lib/proFeatures";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true"
  );
}

function ProFeatureRow({ feature, index, onNavigate }) {
  const Icon = feature.icon;

  return (
    <li
      className="stitch-pro-feature-row flex items-start gap-3"
      style={{ "--row-index": index }}
    >
      <span className="stitch-pro-feature-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="font-display-semibold text-[13px] leading-none text-foreground">
          {feature.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {feature.description}
        </p>
        <Link
          href={`/pro/${feature.slug}`}
          onClick={onNavigate}
          className="mt-1.5 inline-flex items-center gap-0.5 text-[11px] font-semibold text-[var(--pro-blue)] underline-offset-2 transition-colors hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--pro-blue)]/60"
        >
          Learn more
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </Link>
      </div>
    </li>
  );
}

function StitchProModal({
  onClose,
  titleId,
  descriptionId,
  dialogId,
  returnFocusRef,
}) {
  const panelRef = useRef(null);
  const closeButtonRef = useRef(null);
  const emailInputRef = useRef(null);
  const previouslyFocusedRef = useRef(null);
  const [formOpen, setFormOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [requestState, setRequestState] = useState("idle");
  const [requestError, setRequestError] = useState(null);

  const showForm = formOpen && requestState !== "success";

  const openForm = useCallback(() => {
    if (requestState === "loading" || requestState === "success") return;
    setRequestError(null);
    setFormOpen(true);
  }, [requestState]);

  useEffect(() => {
    if (!showForm) return;
    const focusTimer = window.setTimeout(() => {
      emailInputRef.current?.focus();
    }, 180);
    return () => window.clearTimeout(focusTimer);
  }, [showForm]);

  const handleSubmitAccess = useCallback(
    async (event) => {
      event.preventDefault();
      if (requestState === "loading" || requestState === "success") return;

      setRequestError(null);
      setRequestState("loading");

      try {
        await requestProAccess({ email });
        setRequestState("success");
        setFormOpen(false);
      } catch (error) {
        setRequestState("error");
        setRequestError(
          error instanceof Error
            ? error.message
            : "Could not send your request. Try again."
        );
      }
    },
    [email, requestState]
  );

  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onClose();
        return;
      }

      if (event.key !== "Tab" || !panelRef.current) return;

      const focusable = getFocusableElements(panelRef.current);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      const focusInPanel = panelRef.current.contains(active);

      if (!focusInPanel) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown, true);

      const returnTarget =
        returnFocusRef?.current ?? previouslyFocusedRef.current;
      if (returnTarget instanceof HTMLElement && returnTarget.isConnected) {
        returnTarget.focus();
      }
    };
  }, [onClose, returnFocusRef]);

  return createPortal(
    <div className="stitch-pro-modal-root fixed inset-0 z-[100] flex items-end justify-center p-3 sm:items-center sm:p-6">
      <button
        type="button"
        className="stitch-pro-modal-backdrop absolute inset-0 cursor-default bg-[#1c1917]/35 backdrop-blur-md"
        aria-label="Close Stitch Pro dialog"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        id={dialogId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="stitch-pro-modal-panel relative z-10 w-full max-w-[min(500px,calc(100vw-1.5rem))] origin-bottom sm:origin-center"
      >
        <div className="stitch-pro-modal-frame overflow-hidden rounded-md border border-white/20 bg-surface shadow-[0_32px_64px_-24px_rgba(6,17,92,0.45),0_0_0_1px_rgba(255,255,255,0.12)_inset]">
          <div className="stitch-pro-modal-scene relative aspect-[500/280] w-full">
            <Image
              src="/style-refs/oil-painting.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 640px) 100vw, 500px"
              className="object-cover object-center"
            />
            <div
              className="stitch-pro-modal-scrim stitch-pro-modal-scrim--hero pointer-events-none absolute inset-0"
              aria-hidden
            />
            <div
              className="stitch-pro-modal-edge-fade pointer-events-none absolute inset-x-0 bottom-0 z-[1]"
              aria-hidden
            />

            <header className="absolute inset-x-0 top-0 z-10 px-5 py-4 pr-14">
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-md border border-white/25 bg-black/20 text-white/90 backdrop-blur-md transition-[background,transform] duration-200 hover:bg-black/35 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/70"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>

              <span className="stitch-pro-modal-eyebrow inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-black/25 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-md">
                <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                Coming soon
              </span>

              <h2
                id={titleId}
                className="mt-3 text-xl font-semibold leading-tight text-white sm:text-2xl"
              >
                Stitch Pro
              </h2>
              <p
                id={descriptionId}
                className="mt-1.5 max-w-sm text-sm leading-relaxed text-white/85"
              >
                Turn every chapter, character, and place into illustrated pages.
              </p>
            </header>
          </div>

          <div className="stitch-pro-modal-sheet px-5 pb-5">
              <h3 className="text-sm font-semibold text-foreground">
                Beyond the free preview
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Your first three chapters stay free. Pro opens the full toolkit.
              </p>

              <ul className="stitch-pro-feature-list mt-4 space-y-3">
                {PRO_FEATURES.map((feature, index) => (
                  <ProFeatureRow
                    key={feature.id}
                    feature={feature}
                    index={index}
                    onNavigate={onClose}
                  />
                ))}
              </ul>

              <div className="mt-5 flex flex-col gap-2.5">
                {requestState === "success" ? (
                  <p className="rounded-md border border-[var(--pro-blue)]/20 bg-[var(--pro-blue)]/5 px-3 py-2.5 text-center text-xs leading-relaxed text-foreground">
                    Request sent. We&apos;ll email you when Stitch Pro opens up.
                  </p>
                ) : null}

                {requestError ? (
                  <p
                    role="alert"
                    className="rounded-md border border-red-200/80 bg-red-50 px-3 py-2 text-center text-xs leading-relaxed text-red-700"
                  >
                    {requestError}
                  </p>
                ) : null}

                <button
                  type="button"
                  onClick={requestState === "success" ? onClose : openForm}
                  disabled={requestState === "loading"}
                  aria-expanded={showForm}
                  className="btn-pro-primary btn-pro-primary--block disabled:opacity-70"
                >
                  {requestState === "success" ? (
                    <>
                      Close
                      <Check className="h-4 w-4" aria-hidden />
                    </>
                  ) : (
                    <>
                      Request access
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </>
                  )}
                </button>

                <div
                  className={`stitch-pro-access-form ${showForm ? "stitch-pro-access-form--open" : ""}`}
                  aria-hidden={!showForm}
                >
                  <div className="stitch-pro-access-form-inner">
                    <form
                      onSubmit={handleSubmitAccess}
                      className="stitch-pro-access-form-el"
                    >
                      <div className="stitch-pro-access-control">
                        <label htmlFor="stitch-pro-email" className="sr-only">
                          Email for early access
                        </label>
                        <input
                          ref={emailInputRef}
                          id="stitch-pro-email"
                          type="email"
                          name="email"
                          value={email}
                          onChange={(event) => {
                            setEmail(event.target.value);
                            if (requestError) setRequestError(null);
                            if (requestState === "error") {
                              setRequestState("idle");
                            }
                          }}
                          placeholder="you@example.com"
                          required
                          autoComplete="email"
                          disabled={requestState === "loading"}
                          className="stitch-pro-access-input"
                        />
                        <button
                          type="submit"
                          disabled={requestState === "loading"}
                          className="stitch-pro-access-submit"
                          aria-label="Submit access request"
                        >
                          {requestState === "loading" ? (
                            <Loader2
                              className="h-4 w-4 animate-spin"
                              aria-hidden
                            />
                          ) : (
                            <ArrowRight className="h-4 w-4" aria-hidden />
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={requestState === "loading"}
                  className="w-full rounded-md px-4 py-2 text-center text-xs font-medium text-muted transition-colors hover:text-foreground active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Maybe later
                </button>
              </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function useStitchProModal() {
  const titleId = useId();
  const descriptionId = useId();
  const dialogId = useId();
  const triggerRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const modal =
    mounted && open ? (
      <StitchProModal
        onClose={closeModal}
        titleId={titleId}
        descriptionId={descriptionId}
        dialogId={dialogId}
        returnFocusRef={triggerRef}
      />
    ) : null;

  return {
    triggerRef,
    openModal,
    closeModal,
    open,
    dialogId,
    modal,
  };
}

export default function StitchProChiclet({ className = "", modalControl }) {
  const fallback = useStitchProModal();
  const { triggerRef, openModal, open, dialogId, modal } = modalControl ?? fallback;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openModal}
        className={`stitch-pro-chiclet group ${className}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? dialogId : undefined}
      >
        <span className="stitch-pro-chiclet-inner">
          <span
            className="stitch-pro-icon-chip flex h-6 w-6 items-center justify-center rounded-md transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-105"
            aria-hidden
          >
            <Sparkles
              className="h-3.5 w-3.5 text-[var(--pro-blue)]"
              strokeWidth={1.75}
            />
          </span>
          <span className="font-display-semibold text-[13px] text-[var(--pro-navy)]">
            Stitch Pro
          </span>
          <span className="stitch-pro-badge rounded-full px-1.5 py-px text-[9px] font-semibold uppercase tracking-wider">
            Pro
          </span>
        </span>
      </button>

      {modal}
    </>
  );
}
