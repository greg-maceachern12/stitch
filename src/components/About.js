"use client";

import Link from "next/link";
import { Github, ExternalLink, ArrowLeft } from "lucide-react";
import SiteChrome from "@/components/SiteChrome";

function About() {
  return (
    <SiteChrome variant="default">
      <article className="w-full">
        <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">About Visuai</h1>
          <Link href="/" className="btn-ghost shrink-0 self-start">
            <ArrowLeft className="h-4 w-4" />
            Back to app
          </Link>
        </header>

        <div className="prose prose-neutral max-w-none prose-headings:font-semibold prose-headings:text-foreground prose-p:text-foreground/90 prose-a:text-foreground prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-foreground/80 prose-li:text-foreground/90">
          <p>
            Welcome to Visuai — a project inspired by the rich visual descriptions found in
            recent fictional books I&apos;ve been reading, from the likes of the Dune series,
            the Way of Kings and Eragon.
          </p>

          <p className="text-muted">
            While reading these books, I found that authors significantly invest in crafting
            rich visual details for many of their environments, characters, scenes etc. My
            brain struggled to fully comprehend and visualize this. I often found myself
            searching Google for fan renditions of the characters to aid my imagination rather
            than lean on the descriptions provided by the author.
          </p>

          <p>
            See the{" "}
            <a href="https://landvisuai.netlify.app/" target="_blank" rel="noreferrer">
              landing page
            </a>{" "}
            for examples of such scenes.
          </p>

          <p>
            It became apparent that the authors were essentially providing well-written prompts
            to generate this content, encompassing scenes, characters, environments, and more,
            for the reader. What was missing was an interface to connect these elements
            together.
          </p>

          <p>
            I would love to ship this as a Kindle/iBooks extension, directly integrated into
            the reading experience, automatically generating visuals for the user or based on
            highlighted content. Until Amazon or Apple opens up an extensions marketplace,
            Visuai will operate as a self-serve platform.
          </p>

          <p>
            For now, users can browse chapter by chapter and/or select a specific chapter to
            explore a visual representation of that portion of the book. In the{" "}
            <a href="https://pro.visuai.io" target="_blank" rel="noreferrer">
              pro version
            </a>
            , you can upload a whole epub and Visuai will generate visuals for the entire book,
            adding them to the beginning of each chapter.
          </p>

          <h2>Planned improvements</h2>
          <ul>
            <li>
              Migrate to Midjourney for consistent characters in the generation (massively
              important!) once the API is opened up.
            </li>
            <li>Utilization of control nets for enhanced image generation</li>
          </ul>

          <aside className="not-prose my-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-950">
              Please don&apos;t go crazy on the generations… this eats up my OpenRouter/SD
              credits.
            </p>
          </aside>
        </div>

        <footer className="mt-10 flex flex-wrap gap-3 border-t border-border pt-8 not-prose">
          <a
            href="https://github.com/greg-maceachern12/VisualE"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://landvisuai.netlify.app/"
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <ExternalLink className="h-4 w-4" />
            Landing page
          </a>
        </footer>
      </article>
    </SiteChrome>
  );
}

export default About;
