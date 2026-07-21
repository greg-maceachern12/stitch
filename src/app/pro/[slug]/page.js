import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";
import {
  PRO_FEATURES,
  getProFeature,
  getProFeatureSlugs,
} from "@/lib/proFeatures";

export function generateStaticParams() {
  return getProFeatureSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const feature = getProFeature(slug);

  if (!feature) {
    return { title: "Visuai Pro" };
  }

  return {
    title: `${feature.title} — Visuai Pro`,
    description: feature.description,
  };
}

export default async function ProFeaturePage({ params }) {
  const { slug } = await params;
  const feature = getProFeature(slug);

  if (!feature) {
    notFound();
  }

  const { detail } = feature;
  const Icon = feature.icon;
  const otherFeatures = PRO_FEATURES.filter((item) => item.id !== feature.id);

  return (
    <SiteChrome variant="default">
      <article className="w-full">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pro-blue)]/25 bg-[var(--pro-blue)]/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--pro-blue)]">
              <Sparkles className="h-3 w-3" strokeWidth={2} aria-hidden />
              {detail.eyebrow}
            </span>
            <div className="flex items-start gap-3">
              <span className="visuai-pro-feature-icon mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-md">
                <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
              </span>
              <h1 className="text-4xl text-foreground">{feature.title}</h1>
            </div>
          </div>
          <Link href="/app" className="btn-ghost shrink-0 self-start">
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </header>

        <p className="max-w-2xl text-lg leading-relaxed text-foreground/90">
          {detail.tagline}
        </p>

        <div className="prose prose-neutral mt-8 max-w-none prose-headings:font-serif prose-h2:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-foreground/80 prose-li:text-foreground/90">
          <p>{detail.intro}</p>

          {detail.sections.map((section) => (
            <section key={section.heading}>
              <h2>{section.heading}</h2>
              <p>{section.body}</p>
            </section>
          ))}
        </div>

        {detail.highlights?.length ? (
          <div className="not-prose mt-8 rounded-md border border-border bg-surface p-6 shadow-card">
            <h2 className="font-display-semibold text-sm text-foreground">
              What you get
            </h2>
            <ul className="mt-4 space-y-2.5">
              {detail.highlights.map((highlight) => (
                <li key={highlight} className="flex items-start gap-2.5">
                  <Check
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--pro-blue)]"
                    strokeWidth={2.25}
                    aria-hidden
                  />
                  <span className="text-sm leading-relaxed text-foreground/90">
                    {highlight}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {otherFeatures.length ? (
          <nav
            aria-label="More Visuai Pro features"
            className="mt-10 border-t border-border pt-8"
          >
            <h2 className="font-display-semibold text-sm text-foreground">
              More in Visuai Pro
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {otherFeatures.map((item) => {
                const ItemIcon = item.icon;
                return (
                  <Link
                    key={item.id}
                    href={`/pro/${item.slug}`}
                    className="group flex items-start gap-3 rounded-md border border-border bg-surface p-4 transition-colors hover:bg-hover-surface"
                  >
                    <span className="visuai-pro-feature-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-md">
                      <ItemIcon className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-display-semibold text-[13px] text-foreground">
                        {item.title}
                      </span>
                      <span className="mt-1 block text-xs leading-relaxed text-muted">
                        {item.description}
                      </span>
                    </span>
                  </Link>
                );
              })}
            </div>
          </nav>
        ) : null}
      </article>
    </SiteChrome>
  );
}
