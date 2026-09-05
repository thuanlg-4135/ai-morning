# Publishing AI Morning

AI Morning uses Next.js App Router with a static export:

    content/YYYY-MM-DD.json
            ↓
    news-quality gates + lib/editions.mjs
            ↓
    Next.js app/ + components/
            ↓
    out/ → dist/ (with .nojekyll)
            ↓
    GitHub Pages

## Setup and daily workflow

Use Node 20.9 or newer; CI uses Node 24. Run `npm ci` after cloning or updating dependencies.

1. Research and add `content/YYYY-MM-DD.json` according to `AGENTS.md`.
2. Run `npm run test:news`.
3. Run `npm run news:index` to validate events and explicitly regenerate the cross-edition news ledger.
4. Run `npm run news:check`, then `npm run build`.
5. Run `npm run preview` and open `http://localhost:8080/ai-morning/`.
6. Check the root, changed date routes, older dates, and archive. English routes exist only for reviewed translations.
7. Commit the JSON file together with `data/news-index.json`. Daily content does not require layout, runtime, validator, or schema edits.
8. Push to main. GitHub Actions installs locked dependencies, validates and builds the site, and uploads only `dist/`.

## Build behavior

`npm run build`:

- runs news-quality regression tests;
- checks evidence, depth, timestamps, event identity, duplicates, and ledger freshness;
- preserves editorial warnings without treating them as hard failures;
- copies editorial assets and licensed fonts into the generated `public/assets/` directory;
- validates each edition with the shared schema validator;
- builds every dated page and the latest root page using Next.js static generation;
- builds Vietnamese and reviewed English archives;
- exports HTML and assets, then copies the complete export to `dist/`;
- writes `.nojekyll` so Pages serves `_next/` assets;
- tests every exported edition's text, language, sources, archive order, local links, fragment targets, and assets.

The build never regenerates the ledger silently. Fix stale derived state explicitly with `npm run news:index`. `dist/`, `out/`, `.next/`, and `public/assets/` are ignored build artifacts.

## GitHub Pages settings

Keep Pages configured to **GitHub Actions**. The workflow uploads `dist/` with `actions/upload-pages-artifact` and deploys with `actions/deploy-pages`.

`next.config.mjs` uses `output: 'export'`, `trailingSlash: true`, and `/ai-morning` as the default base path. The app needs no server functions or image optimization service. Local fonts and images ship with the export.

To host at the domain root, set `NEXT_PUBLIC_BASE_PATH=''` consistently for build and preview. A path change requires a rebuild because Next.js embeds the base path in its client bundles.

## UI verification

After presentation or routing changes:

```bash
npm run build
npx playwright install chromium
npm run test:browser
npm run format:check
```

Browser tests serve the actual export. They check all published routes at 360, 412, 768, 1440, and 1920px, missing images and assets, runtime errors, archive search, saved stories, reading preferences, checklist controls, VI/EN navigation, reduced motion, and no-JavaScript reading. Screenshots of every route at mobile and desktop sizes go into `.verification/pages/`; visually inspect these before handoff.

Also inspect source labels and body copy, deep links into articles, the root's latest date, and older editions with SVG diagrams. Unknown visual keys retain the neutral fallback. Source links use a new tab with `noopener noreferrer`.

## Build failures

Validation errors identify the filename, field path, and event. Fix the source JSON and rerun the build; never bypass validation. Static-export test failures identify the missing text, route, fragment, or asset.
