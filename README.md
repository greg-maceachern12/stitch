# Visuai

Visuai is a Next.js app that turns an EPUB into an illustrated EPUB. Upload a
book, choose an image style and OpenRouter image model, and the app generates a
chapter-opening illustration for each story chapter before packaging the result
for download in the browser.

## How It Works

1. The browser parses the uploaded EPUB with EPUB.js and reads metadata, cover,
   table of contents, and chapter HTML.
2. Non-story front/back matter is skipped by label, while story chapters are
   rendered and prepared for illustration.
3. The browser calls local Next.js route handlers:
   - `POST /api/generate-prompt` builds a style-aware image prompt.
   - `POST /api/generate-image` generates an illustration with OpenRouter.
4. The browser removes existing chapter images, inserts generated
   chapter-opening artwork, builds the final EPUB with JSZip, and starts the
   download locally. No generated EPUB is stored on the server.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Next.js loads `.env.local` for local development. Use `NEXT_PUBLIC_` only for
values that must reach the browser; keep API keys unprefixed so they stay
server-only.

## Environment

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000

OPENROUTER_API_KEY=sk-or-v1-your-openrouter-key
OPENROUTER_MODEL=google/gemini-3.5-flash
OPENROUTER_IMAGE_MODEL=x-ai/grok-imagine-image-quality

API_USE_MOCKS=false
```

Set `API_USE_MOCKS=true` to exercise the UI and EPUB build path without calling
OpenRouter.

## Scripts

```bash
npm run dev      # local development
npm run lint     # ESLint
npm run build    # production build
npm run start    # start production server
```

## Current Scope

- EPUB upload and in-browser EPUB assembly.
- OpenRouter-backed prompt and image generation through Next.js API routes.
- Style/model selection, progress tracking, and About page.

PDF support, auth, payments, and server-side EPUB storage are intentionally not
part of the current app.
