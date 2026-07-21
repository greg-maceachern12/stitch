"use client";

import Image from "next/image";
import { IMAGE_STYLE_OPTIONS } from "@/lib/imageStyles";

const STEPS = [
  {
    num: "01",
    title: "Upload an EPUB",
    body: "Drop in any EPUB. Visuai reads each chapter and finds the moments worth illustrating.",
    visual: "upload",
  },
  {
    num: "02",
    title: "Pick an art style",
    body: "Oil painting, watercolor, anime, or photoreal — one look for the whole book.",
    visual: "styles",
  },
  {
    num: "03",
    title: "Download illustrated EPUB",
    body: "Art placed beside the passages it depicts — ready for your reader or Kindle.",
    visual: "result",
  },
];

const SAMPLE_PASSAGE =
  "The massive space plane on the tarmac before operations. The hull was weathered, scorched from more than thirty reentries…";

function UploadVisual() {
  return (
    <div
      className="rounded-md border border-border bg-background p-5 shadow-card"
      aria-hidden
    >
      <p
        className="text-center font-display-semibold text-xs text-muted"
        translate="no"
      >
        The Dark Forest
      </p>
      <p className="mt-3 font-serif text-sm italic leading-relaxed text-foreground/75">
        {SAMPLE_PASSAGE}
      </p>
    </div>
  );
}

function StylesVisual() {
  return (
    <ul className="grid grid-cols-4 gap-2" aria-hidden>
      {IMAGE_STYLE_OPTIONS.map((style, index) => (
        <li key={style.id}>
          <div
            className={`overflow-hidden rounded-md border bg-background ${
              index === 0
                ? "border-foreground/25 ring-1 ring-foreground/10"
                : "border-border"
            }`}
          >
            <div className="relative aspect-[3/4]">
              <Image
                src={style.previewImageUrl}
                alt=""
                fill
                sizes="(max-width: 768px) 20vw, 80px"
                loading="lazy"
                className="object-cover"
              />
            </div>
            <p className="truncate px-1.5 py-1.5 text-center text-[10px] font-medium text-foreground">
              {style.label}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ResultVisual() {
  return (
    <figure className="mx-auto max-w-[13rem] sm:max-w-[15rem]">
      <div className="overflow-hidden rounded-md border border-border bg-background shadow-card">
        <Image
          src="/examples/ex_dark_forest.png"
          alt="Illustrated page from The Dark Forest with art inline beside the text"
          width={640}
          height={900}
          sizes="(max-width: 768px) 52vw, 240px"
          loading="lazy"
          className="block h-auto w-full"
        />
      </div>
    </figure>
  );
}

function StepVisual({ type }) {
  if (type === "upload") return <UploadVisual />;
  if (type === "styles") return <StylesVisual />;
  return <ResultVisual />;
}

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <div
      data-reveal
      className={`home-reveal ${className}`}
      style={{ "--reveal-delay": `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="home-flow border-b border-border bg-surface py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <header className="mb-12 max-w-xl sm:mb-14">
            <h2 className="home-flow-title text-balance text-3xl font-semibold text-foreground sm:text-4xl">
              How it works
            </h2>
            <p className="mt-3 text-base leading-relaxed text-muted">
              Three steps from plain text to illustrated ebook.
            </p>
          </header>
        </Reveal>

        <ol className="flex flex-col gap-12 sm:gap-14" aria-label="How Visuai works">
          {STEPS.map((step, index) => (
            <li key={step.num}>
              <Reveal delay={index * 80}>
                <div className="grid items-center gap-6 md:grid-cols-[3.5rem_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
                  <span
                    className="font-serif text-3xl font-semibold tabular-nums leading-none text-foreground/15 md:text-4xl"
                    aria-hidden
                  >
                    {step.num}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-display-semibold text-lg text-foreground sm:text-xl">
                      {step.title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
                      {step.body}
                    </p>
                  </div>

                  <div className="min-w-0 md:max-w-xs md:justify-self-end md:w-full">
                    <StepVisual type={step.visual} />
                  </div>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
