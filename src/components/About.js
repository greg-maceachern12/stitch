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
            Visuai started while I was deep in a stack of recent fiction — the Dune series,
            The Way of Kings, Eragon — and noticing how much work the authors put into
            describing what things actually look like.
          </p>

          <p className="text-muted">
            The problem was on my end. My brain couldn&apos;t keep up with the level of visual
            detail packed into the environments, characters, and scenes. I&apos;d end up on
            Google, hunting for fan renditions of a character to anchor my imagination,
            instead of leaning on what the author had already written.
          </p>

          <blockquote>
            <p>
              “The autumn leaves blew over the moonlit pavement in such a way as to make the
              girl who was moving there seem fixed to a sliding walk, letting the motion of
              the wind and the leaves carry her forward. [...] The trees overhead made a great
              sound of letting down their dry rain.”
            </p>
            <p>― Ray Bradbury, Fahrenheit 451</p>
          </blockquote>

          <p>
            So I built Visuai to bring these books to life — to generate lore-accurate images
            of the characters and environments as you read.
          </p>

          <p>
            Ideally this lives inside Kindle or iBooks as an extension, generating visuals
            automatically or from highlighted passages. Until Amazon or Apple opens up an
            extensions marketplace, Visuai runs as a self-serve platform.
          </p>

          <h2>Planned improvements</h2>
          <ul>
            <li>
              Character Glossary: a per-book index of characters, with images and descriptions.
            </li>
            <li>ControlNets for better image generation.</li>
          </ul>

          <aside className="not-prose my-8 rounded-md border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-medium text-amber-950">
              Please don&apos;t go crazy on the generations… this eats up my OpenRouter
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
        </footer>
      </article>
    </SiteChrome>
  );
}

export default About;
