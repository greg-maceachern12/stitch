"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Layers,
  Palette,
  Shield,
  Sparkles,
} from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import HowItWorks from "@/components/HowItWorks";
import { useVisuaiProModal } from "@/components/VisuaiProChiclet";
import { PRO_FEATURES } from "@/lib/proFeatures";

const VALUE_PROPS = [
  {
    icon: BookOpen,
    title: "Lore-accurate",
    body: "Illustrations are drawn from the author's own prose — characters, places, and scenes as described on the page.",
  },
  {
    icon: Shield,
    title: "Spoiler-safe",
    body: "Images only ever draw on text up to your current chapter, so nothing later in the book gets revealed early.",
  },
  {
    icon: Layers,
    title: "Reads like a real edition",
    body: "Art is placed and sized to flow with the text in the exported EPUB, like a printed illustrated book.",
  },
  {
    icon: Palette,
    title: "A style per book",
    body: "Oil painting, watercolor, anime, or photoreal — pick the look that fits each title and keep it through the whole book.",
  },
];

function useRevealOnScroll() {
  const rootRef = useRef(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    const targets = root.querySelectorAll("[data-reveal]");
    if (prefersReducedMotion) {
      targets.forEach((el) => el.classList.add("home-reveal--visible"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("home-reveal--visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );

    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return rootRef;
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

function ProFeatureCard({ feature, index }) {
  const Icon = feature.icon;

  return (
    <Reveal delay={index * 80}>
      <Link
        href={`/pro/${feature.slug}`}
        className="group flex h-full flex-col rounded-md border border-border bg-surface p-5 transition-colors hover:bg-hover-surface"
      >
        <span className="visuai-pro-feature-icon flex h-9 w-9 items-center justify-center rounded-md">
          <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        </span>
        <h3 className="mt-4 font-display-semibold text-base text-foreground">
          {feature.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
          {feature.description}
        </p>
        <span className="mt-4 inline-flex items-center gap-0.5 text-xs font-semibold text-[var(--pro-blue)] transition-colors group-hover:underline">
          Learn more
          <ArrowUpRight className="h-3 w-3" aria-hidden />
        </span>
      </Link>
    </Reveal>
  );
}

export default function Home() {
  const rootRef = useRevealOnScroll();
  const proModal = useVisuaiProModal();

  return (
    <SiteChrome variant="landing">
      <div ref={rootRef} className="w-full">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="home-hero-image absolute inset-0" aria-hidden>
            <Image
              src="/style-refs/oil-painting.jpg"
              alt=""
              fill
              priority
              sizes="100vw"
              className="object-cover object-center"
            />
            <div className="home-hero-scrim absolute inset-0" />
          </div>

          <div className="relative mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
            <div className="mx-auto max-w-2xl text-center">
              <Reveal>
                <p
                  className="mb-6 flex items-center justify-center gap-3 text-4xl md:gap-4 md:text-5xl"
                  aria-hidden="true"
                >
                  <span>📖</span>
                  <ArrowRight
                    className="h-7 w-7 shrink-0 text-muted md:h-8 md:w-8"
                    strokeWidth={2}
                  />
                  <span>🌄</span>
                </p>
              </Reveal>

              <Reveal delay={60}>
                <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                  Turn words into worlds
                </h1>
              </Reveal>

              <Reveal delay={120}>
                <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted sm:text-lg">
                  Upload any EPUB and Visuai paints lore-accurate illustrations
                  into every chapter — then hands you back a finished illustrated
                  ebook.
                </p>
              </Reveal>

              <Reveal delay={180}>
                <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <Link href="/app" className="btn-primary w-full sm:w-auto sm:min-w-[180px]">
                    Open the app
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                  <a href="#how-it-works" className="btn-ghost w-full sm:w-auto">
                    See how it works
                  </a>
                </div>
              </Reveal>
            </div>
          </div>
        </section>

        <HowItWorks />

        {/* Why Visuai */}
        <section className="border-b border-border py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <Reveal>
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                  Why Visuai
                </h2>
                <p className="mt-4 text-base text-muted">
                  Built for readers who want to see what the author described.
                </p>
              </div>
            </Reveal>

            <div className="mt-14 grid gap-6 sm:grid-cols-2">
              {VALUE_PROPS.map((prop, index) => {
                const Icon = prop.icon;
                return (
                  <Reveal key={prop.title} delay={index * 60}>
                    <div className="form-card h-full">
                      <span className="flex h-9 w-9 items-center justify-center rounded-md border border-border bg-background text-muted">
                        <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                      </span>
                      <h3 className="mt-4 font-display-semibold text-base text-foreground">
                        {prop.title}
                      </h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">
                        {prop.body}
                      </p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>

        {/* Visuai Pro */}
        <section className="border-b border-border bg-surface py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="pro-gradient-ring rounded-md">
              <div className="pro-gradient-ring-inner pro-gradient-ring-inner--fill overflow-hidden rounded-md p-6 sm:p-10">
                <div className="relative">
                  <div
                    className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 opacity-20 sm:h-64 sm:w-64"
                    aria-hidden
                  >
                    <Image
                      src="/pro_bg.png"
                      alt=""
                      fill
                      sizes="256px"
                      className="object-contain object-right-top"
                    />
                  </div>

                  <Reveal>
                    <div className="relative max-w-xl">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pro-blue)]/25 bg-[var(--pro-blue)]/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pro-blue)]">
                        <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
                        Visuai Pro
                      </span>
                      <h2 className="mt-4 text-3xl font-semibold text-foreground sm:text-4xl">
                        Beyond the free preview
                      </h2>
                      <p className="mt-4 text-base leading-relaxed text-muted">
                        Your first three chapters stay free. Pro opens the full
                        toolkit — Story Atlas, in-chapter art, and custom image
                        models.
                      </p>
                    </div>
                  </Reveal>

                  <div className="relative mt-10 grid gap-4 sm:grid-cols-3">
                    {PRO_FEATURES.map((feature, index) => (
                      <ProFeatureCard
                        key={feature.id}
                        feature={feature}
                        index={index}
                      />
                    ))}
                  </div>

                  <Reveal delay={240}>
                    <div className="relative mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                      <button
                        ref={proModal.triggerRef}
                        type="button"
                        onClick={proModal.openModal}
                        className="btn-pro-primary"
                        aria-haspopup="dialog"
                        aria-expanded={proModal.open}
                        aria-controls={proModal.open ? proModal.dialogId : undefined}
                      >
                        Request access
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                      <p className="text-sm text-muted">
                        Coming soon — join the waitlist for early access.
                      </p>
                    </div>
                  </Reveal>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="py-20 sm:py-24">
          <div className="mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
            <Reveal>
              <h2 className="text-3xl font-semibold text-foreground sm:text-4xl">
                Ready to illustrate your next read?
              </h2>
              <p className="mx-auto mt-4 max-w-md text-base text-muted">
                Upload an EPUB and see your book come to life — free for the first
                three chapters.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link href="/app" className="btn-primary w-full sm:w-auto sm:min-w-[180px]">
                  Open the app
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </Link>
                <Link href="/about" className="btn-ghost w-full sm:w-auto">
                  Read our story
                </Link>
              </div>
            </Reveal>
          </div>
        </section>
      </div>

      {proModal.modal}
    </SiteChrome>
  );
}
