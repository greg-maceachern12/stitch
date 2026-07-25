# Stitch

Upload an EPUB, pick a style and image model, and get back an illustrated EPUB. Stitch finds the passages worth drawing inside each story chapter, generates section art, and builds the new file in your browser. The server never stores your book or the finished download.

## Why I built this

I was deep in recent fiction — Dune, The Way of Kings, Eragon — and kept noticing how hard the authors work to show you what things look like. The problem was me. I couldn't keep up with the density of environments, characters, and scenes. I'd leave the page and search for fan art instead of leaning on what was already on it.

Bradbury does the thing I'm talking about in *Fahrenheit 451*: a girl on moonlit pavement, trees overhead "letting down their dry rain." That writing asks you to see the scene. I wanted help seeing it without breaking the read.

Stitch generates lore-aware images of characters and places as you go. Eventually this should live inside Kindle or iBooks — automatic art, or art from a highlight. Amazon and Apple don't offer that kind of extension yet, so for now it's a self-serve web app.

## What works today

- EPUB upload, in-browser preview, and local EPUB assembly
- Illustration modes: chapter opener or section art inside chapters
- Style and OpenRouter image model selection, with progress while it runs
- OpenRouter-backed prompt and image generation through Next.js API routes
- Mock mode for UI and EPUB plumbing without calling the provider (`API_USE_MOCKS=true`)

By default, illustration runs on the first few story chapters. You can unlock the full book in the UI when you want every chapter covered (still client-side, still your API key).

## How it works

1. The browser parses the EPUB with EPUB.js (metadata, cover, table of contents, chapter HTML).
2. Non-story front and back matter is skipped by label; story chapters are rendered for illustration.
3. The browser calls local route handlers:
   - `POST /api/select-illustration-sections` — section anchors and style-aware prompts
   - `POST /api/generate-image` — illustrations via OpenRouter
4. Existing chapter images are removed, generated art is inserted before selected passages, JSZip builds the EPUB, and the download starts.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Copy `.env.example` to `.env.local` and add at least `OPENROUTER_API_KEY` for real generations. Use `NEXT_PUBLIC_` only for values that must reach the browser; keep API keys unprefixed so they stay server-only.

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
OPENROUTER_MODEL=google/gemini-3.5-flash-lite

API_USE_MOCKS=false
```

Image model is chosen in the UI (see `.env.example` for optional Web3Forms key if you use Stitch Pro access requests).

## Scripts

```bash
npm run dev      # local development
npm run lint     # ESLint
npm run build    # production build
npm run start    # production server
```

## Roadmap (from the app)

- Character glossary per book — names, descriptions, reference images
- ControlNets for tighter control over generated art

## Out of scope for now

PDF import, auth, payments, and server-side EPUB storage.

## Links

- About (`/about` when the app is running) — same story, plus a note about OpenRouter credits on a self-hosted instance
- [GitHub](https://github.com/greg-maceachern12/stitch)
