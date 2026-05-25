"use client";

import { useRef } from "react";
import { ChevronDown } from "lucide-react";
import { DEFAULT_IMAGE_STYLE, IMAGE_STYLE_OPTIONS } from "@/lib/imageStyles";
import {
  DEFAULT_IMAGE_MODEL,
  IMAGE_MODEL_OPTIONS,
} from "@/lib/imageModels";

function ModelDropdown({ imageModel, onImageModelChange, disabled }) {
  const selected =
    IMAGE_MODEL_OPTIONS.find((o) => o.id === imageModel) ??
    IMAGE_MODEL_OPTIONS[0];

  return (
    <div className="w-56">
      <label htmlFor="image-model-select" className="sr-only">
        Image model
      </label>
      <div className="flex items-center gap-2 rounded-md border border-border bg-background pl-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border/80 bg-surface">
          <img
            src={selected.logoUrl}
            alt=""
            className="h-5 w-5 object-contain"
          />
        </span>
        <div className="relative min-w-0 flex-1">
          <select
            id="image-model-select"
            value={imageModel}
            disabled={disabled}
            onChange={(e) => onImageModelChange(e.target.value)}
            className="w-full cursor-pointer appearance-none bg-transparent py-2 pl-0 pr-7 text-xs font-medium text-foreground outline-none disabled:cursor-not-allowed disabled:opacity-40"
          >
            {IMAGE_MODEL_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} ({option.costLabel})
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}

function StyleCarousel({ imageStyle, onImageStyleChange, disabled }) {
  const indexFromProp = IMAGE_STYLE_OPTIONS.findIndex((o) => o.id === imageStyle);
  const selectedIndex = indexFromProp >= 0 ? indexFromProp : 0;

  const select = (nextIndex) => {
    onImageStyleChange(IMAGE_STYLE_OPTIONS[nextIndex].id);
  };

  return (
    <div className="w-72" role="radiogroup" aria-label="Image style">
      <div className="flex items-end gap-1.5">
        {IMAGE_STYLE_OPTIONS.map((option, i) => {
          const selected = i === selectedIndex;
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              disabled={disabled}
              onClick={() => select(i)}
              className={`group/style min-w-0 flex flex-col items-center transition-all duration-200 ease-out disabled:opacity-40 ${
                selected ? "flex-[1.35] basis-0" : "flex-[0.85] basis-0 opacity-70 hover:opacity-90"
              }`}
            >
              <span
                className={`block w-full overflow-hidden rounded-md border bg-background transition-all duration-200 ease-out ${
                  selected
                    ? "aspect-[4/3] border-foreground/25 shadow-sm"
                    : "aspect-[4/3] border-border group-hover/style:border-foreground/15"
                }`}
              >
                {option.previewImageUrl ? (
                  <img
                    src={option.previewImageUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="block h-full w-full bg-hover-surface" aria-hidden />
                )}
              </span>
              <span
                className={`mt-1.5 w-full truncate text-center transition-all duration-200 ${
                  selected
                    ? "text-xs font-medium text-foreground"
                    : "text-[10px] text-muted group-hover/style:text-foreground/80"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function OptionsPill({
  imageStyle = DEFAULT_IMAGE_STYLE,
  onImageStyleChange,
  imageModel = DEFAULT_IMAGE_MODEL,
  onImageModelChange,
  disabled = false,
}) {
  const detailsRef = useRef(null);

  return (
    <details ref={detailsRef} className="relative">
      <summary
        className={`options-pill inline-flex list-none items-center gap-1 [&::-webkit-details-marker]:hidden ${
          disabled ? "pointer-events-none opacity-50" : "cursor-pointer"
        }`}
        aria-label="Options"
      >
        <span>Options</span>
        <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
      </summary>

      <div
        className="absolute right-0 top-full z-50 mt-1.5 rounded-lg border border-border bg-surface px-3 py-2.5 shadow-card"
        role="dialog"
        aria-label="Options"
      >
        <section>
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
            Image style
          </p>
          <StyleCarousel
            imageStyle={imageStyle}
            onImageStyleChange={onImageStyleChange}
            disabled={disabled}
          />
        </section>

        <section className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted">
            Image model
          </p>
          <ModelDropdown
            imageModel={imageModel}
            onImageModelChange={onImageModelChange}
            disabled={disabled}
          />
        </section>
      </div>
    </details>
  );
}
