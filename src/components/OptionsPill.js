"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Lock, Sparkles, X } from "lucide-react";
import { DEFAULT_IMAGE_STYLE, IMAGE_STYLE_OPTIONS } from "@/lib/imageStyles";
import {
  DEFAULT_IMAGE_MODEL,
  IMAGE_MODEL_OPTIONS,
} from "@/lib/imageModels";
import { isSectionArtMode, ILLUSTRATION_MODES } from "@/lib/illustrationModes";

function SectionLabel({ children, trailing }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-display-semibold text-xs uppercase tracking-[0.14em] text-muted">
        {children}
      </span>
      {trailing ? <span className="shrink-0">{trailing}</span> : null}
    </div>
  );
}

function StylePreviewModal({ option, onClose }) {
  const titleId = useId();
  const closeRef = useRef(null);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 0);

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown, true);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [onClose]);

  if (!option?.previewImageUrl) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-5 sm:p-8">
      <button
        type="button"
        className="absolute inset-0 cursor-zoom-out bg-foreground/30 backdrop-blur-[6px]"
        aria-label="Close style preview"
        onClick={onClose}
      />
      <figure
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(88vh,36rem)] max-w-[min(92vw,28rem)] flex-col overflow-hidden rounded-xl border border-border/70 bg-surface shadow-[0_28px_64px_-24px_rgba(55,53,47,0.45)]"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-2.5 top-2.5 z-10 rounded-full border border-border/80 bg-surface/90 p-1.5 text-muted shadow-sm backdrop-blur-sm transition-colors hover:bg-surface hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/30"
          aria-label="Close style preview"
        >
          <X className="h-3.5 w-3.5" aria-hidden />
        </button>
        <div className="min-h-0 flex-1 bg-hover-surface/30 p-2 pb-1">
          <img
            src={option.previewImageUrl}
            alt={`${option.label} style reference`}
            className="mx-auto h-full max-h-[min(78vh,32rem)] w-full rounded-lg object-contain"
          />
        </div>
        <figcaption
          id={titleId}
          className="font-display-semibold shrink-0 border-t border-border/80 px-4 py-2.5 text-center text-[13px] tracking-tight text-foreground"
        >
          {option.label}
        </figcaption>
      </figure>
    </div>,
    document.body
  );
}

function StyleGrid({ imageStyle, onImageStyleChange, disabled }) {
  const [previewOption, setPreviewOption] = useState(null);

  return (
    <>
      <div
        className="grid grid-cols-4 gap-2"
        role="radiogroup"
        aria-label="Image style"
      >
        {IMAGE_STYLE_OPTIONS.map((option) => {
          const selected = option.id === imageStyle;
          const hasPreview = Boolean(option.previewImageUrl);

          const selectStyle = () => {
            if (!disabled) onImageStyleChange(option.id);
          };

          const openPreview = () => {
            if (!disabled && hasPreview) {
              onImageStyleChange(option.id);
              setPreviewOption(option);
            }
          };

          return (
            <div
              key={option.id}
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              className={`group/style flex min-w-0 flex-col items-stretch text-center ${
                disabled ? "opacity-40" : ""
              }`}
            >
              {hasPreview ? (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={`View ${option.label} style sample`}
                  onClick={openPreview}
                  className={`relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-[7px] border transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/25 disabled:cursor-not-allowed active:scale-[0.97] ${
                    selected
                      ? "border-foreground/40 shadow-[0_6px_18px_-8px_rgba(55,53,47,0.28),inset_0_0_0_1px_rgba(255,255,255,0.55)] ring-1 ring-foreground/10"
                      : "border-border opacity-65 hover:border-foreground/20 hover:opacity-100"
                  }`}
                >
                  <img
                    src={option.previewImageUrl}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/style:scale-[1.04]"
                  />
                  <span
                    className="pointer-events-none absolute inset-0 bg-foreground/0 transition-colors duration-300 group-hover/style:bg-foreground/[0.06]"
                    aria-hidden
                  />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={disabled}
                  aria-label={option.label}
                  onClick={selectStyle}
                  className={`relative block aspect-square w-full overflow-hidden rounded-[7px] border bg-hover-surface transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/25 disabled:cursor-not-allowed active:scale-[0.97] ${
                    selected
                      ? "border-foreground/40 ring-1 ring-foreground/10"
                      : "border-border opacity-65 hover:border-foreground/20 hover:opacity-100"
                  }`}
                />
              )}
              <button
                type="button"
                disabled={disabled}
                onClick={selectStyle}
                className={`mt-1.5 w-full truncate rounded-sm px-0.5 text-[10.5px] tracking-tight transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/25 disabled:cursor-not-allowed ${
                  selected
                    ? "font-display-semibold text-foreground"
                    : "font-display text-muted hover:text-foreground/70"
                }`}
              >
                {option.label}
              </button>
            </div>
          );
        })}
      </div>
      {previewOption ? (
        <StylePreviewModal
          option={previewOption}
          onClose={() => setPreviewOption(null)}
        />
      ) : null}
    </>
  );
}

function ModelRow({ imageModel, onImageModelChange, disabled }) {
  const selected =
    IMAGE_MODEL_OPTIONS.find((o) => o.id === imageModel) ??
    IMAGE_MODEL_OPTIONS[0];

  return (
    <div
      className={`relative flex items-center gap-2.5 rounded-md border border-border bg-surface px-2 py-1.5 transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:border-foreground/30 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] ${
        disabled ? "opacity-50" : ""
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-[5px] border border-border/70 bg-background">
        <img
          src={selected.logoUrl}
          alt=""
          className="h-4 w-4 object-contain"
        />
      </span>
      <span className="font-display-semibold min-w-0 flex-1 truncate text-sm text-foreground">
        {selected.label}
      </span>
      <ChevronDown
        className="pointer-events-none h-4 w-4 shrink-0 text-muted"
        aria-hidden
      />
      <select
        aria-label="Image model"
        value={imageModel}
        disabled={disabled}
        onChange={(e) => onImageModelChange(e.target.value)}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0 disabled:cursor-not-allowed"
      >
        {IMAGE_MODEL_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ToggleRow({ title, hint, checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors duration-200 hover:bg-hover-surface/60 disabled:cursor-not-allowed disabled:opacity-40"
    >
      <span className="min-w-0 flex-1">
        <span className="font-display-semibold block text-sm text-foreground">
          {title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted">
          {hint}
        </span>
      </span>
      <span
        className={`relative inline-flex h-[18px] w-[30px] shrink-0 items-center rounded-full transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          checked ? "bg-accent" : "bg-border"
        }`}
        aria-hidden
      >
        <span
          className={`inline-block h-3.5 w-3.5 rounded-full bg-surface shadow-[0_1px_2px_rgba(0,0,0,0.25)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            checked ? "translate-x-[14px]" : "translate-x-[2px]"
          }`}
        />
      </span>
    </button>
  );
}

function UnlockForm({
  disabled,
  onProUnlock,
  onClearProUnlockError,
  proUnlockError,
}) {
  const [passcode, setPasscode] = useState("");
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onProUnlock?.(passcode);
      }}
      className="space-y-1.5"
    >
      <div className="flex items-center gap-1.5 rounded-md border border-border bg-surface pl-2.5 pr-1 py-1 transition-colors focus-within:border-foreground/25">
        <Lock
          className="h-3.5 w-3.5 shrink-0 text-muted"
          aria-hidden
          strokeWidth={2}
        />
        <input
          type="password"
          value={passcode}
          onChange={(event) => {
            setPasscode(event.target.value);
            onClearProUnlockError?.();
          }}
          placeholder="Enter pro passcode"
          disabled={disabled}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent py-1.5 text-[13px] text-foreground placeholder:text-muted/70 focus:outline-none disabled:opacity-50"
          aria-label="Pro passcode"
        />
        <button
          type="submit"
          disabled={disabled || !passcode.trim()}
          className="shrink-0 rounded-[5px] bg-foreground px-2.5 py-1 text-[11px] font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-30"
        >
          Unlock
        </button>
      </div>
      {proUnlockError ? (
        <p className="px-0.5 text-[11px] text-danger" role="alert">
          {proUnlockError}
        </p>
      ) : null}
    </form>
  );
}

function UnlockedPill() {
  return (
    <span className="visuai-pro-pill-cyan inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-tight">
      <Sparkles className="h-2.5 w-2.5" strokeWidth={2.25} aria-hidden />
      Unlocked
    </span>
  );
}

export default function OptionsPill({
  imageStyle = DEFAULT_IMAGE_STYLE,
  onImageStyleChange,
  imageModel = DEFAULT_IMAGE_MODEL,
  onImageModelChange,
  illustrationMode,
  onIllustrationModeChange,
  proUnlocked = false,
  onProUnlock,
  proUnlockError,
  onClearProUnlockError,
  fullBookUnlocked = false,
  onFullBookChange,
  storyAtlasEnabled = false,
  onStoryAtlasChange,
  disabled = false,
}) {
  const detailsRef = useRef(null);
  const sectionArtEnabled = isSectionArtMode(illustrationMode);
  const activeStyle =
    IMAGE_STYLE_OPTIONS.find((o) => o.id === imageStyle)?.label ??
    IMAGE_STYLE_OPTIONS[0].label;
  const togglesDisabled = disabled || !proUnlocked;

  const togglePlacement = () => {
    onIllustrationModeChange?.(
      sectionArtEnabled
        ? ILLUSTRATION_MODES.CHAPTER_OPENER
        : ILLUSTRATION_MODES.SECTION_ART
    );
  };

  return (
    <details ref={detailsRef} className="group/options relative">
      <summary
        className={`options-pill inline-flex list-none items-center gap-1.5 [&::-webkit-details-marker]:hidden ${
          disabled ? "cursor-default opacity-50" : "cursor-pointer"
        }`}
        aria-label="Generation options"
        aria-disabled={disabled || undefined}
        onClick={(event) => {
          if (disabled) event.preventDefault();
        }}
      >
        <span className="font-display-semibold">Options</span>
        <span className="hidden max-w-[8rem] truncate text-[10px] font-normal text-muted sm:inline">
          {activeStyle}
        </span>
        <ChevronDown
          className="options-pill-chevron h-3.5 w-3.5 shrink-0 opacity-60 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          aria-hidden
        />
      </summary>

      <div
        className="options-panel absolute right-0 top-full z-50 mt-2 w-[min(100vw-2rem,22rem)] origin-top-right overflow-hidden rounded-xl border border-border/80 bg-surface shadow-[0_18px_44px_-18px_rgba(55,53,47,0.22),0_0_0_1px_rgba(55,53,47,0.04)]"
        role="dialog"
        aria-label="Generation options"
      >
        <div className="space-y-3 p-4">
          <SectionLabel
            trailing={
              <span className="text-[11px] font-normal tracking-tight text-muted">
                {activeStyle}
              </span>
            }
          >
            Style
          </SectionLabel>
          <StyleGrid
            imageStyle={imageStyle}
            onImageStyleChange={onImageStyleChange}
            disabled={disabled}
          />
        </div>

        <div
          className="relative space-y-3 border-t border-border p-4"
          style={{ background: "var(--pro-gradient-soft)" }}
        >
          <SectionLabel trailing={proUnlocked ? <UnlockedPill /> : null}>
            Pro
          </SectionLabel>

          {!proUnlocked ? (
            <UnlockForm
              disabled={disabled}
              onProUnlock={onProUnlock}
              onClearProUnlockError={onClearProUnlockError}
              proUnlockError={proUnlockError}
            />
          ) : null}

          <div className="space-y-1.5">
            <span className="font-display-semibold block text-[10px] uppercase tracking-[0.14em] text-muted/75">
              Image model
            </span>
            <ModelRow
              imageModel={imageModel}
              onImageModelChange={onImageModelChange}
              disabled={togglesDisabled}
            />
          </div>

          <div className="divide-y divide-border overflow-hidden rounded-md border border-border bg-surface">
            <ToggleRow
              title="Section art"
              hint="Place illustrations beside passages within chapters"
              checked={sectionArtEnabled}
              onChange={togglePlacement}
              disabled={togglesDisabled}
            />
            <ToggleRow
              title="Full book"
              hint="Illustrate every chapter, not only the first three"
              checked={fullBookUnlocked}
              onChange={() => onFullBookChange?.(!fullBookUnlocked)}
              disabled={togglesDisabled}
            />
            <ToggleRow
              title="Story Atlas"
              hint="Spoiler-free recap, characters, and places before chapter one"
              checked={storyAtlasEnabled}
              onChange={() => onStoryAtlasChange?.(!storyAtlasEnabled)}
              disabled={togglesDisabled}
            />
          </div>
        </div>
      </div>
    </details>
  );
}
