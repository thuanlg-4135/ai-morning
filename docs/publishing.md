# Publishing AI Morning

AI Morning follows one deterministic flow:

    content/YYYY-MM-DD.json
            ↓
    scripts/build.mjs + templates/
            ↓
    dist/
            ↓
    GitHub Pages

## Daily workflow

1. Research and add content/YYYY-MM-DD.json according to `AGENTS.md`.
2. Run `npm run test:news`.
3. Run `npm run news:index` to validate events and explicitly regenerate the cross-edition news ledger.
4. Run `npm run news:check`, then `npm run build`.
5. Serve and verify the generated site:

       cd dist
       python -m http.server 8080

6. Check /, /YYYY-MM-DD/, older date routes, and /archive/.
7. Commit the JSON file together with `data/news-index.json`. Templates, CSS, JavaScript, validators, schema docs, and generated HTML do not need daily edits.
8. Push to main. GitHub Actions validates, builds the site and uploads only dist/.

## Build behavior

npm run build:

- runs the news-quality regression suite;
- uses the same canonical schema validator as the renderer;
- checks that every item has event identity, source evidence, structural depth and valid freshness;
- rejects duplicate or likely duplicate events and a stale `data/news-index.json`;
- prints editorial-theme and unusual-length warnings without failing solely on those warnings;
- scans every content/*.json file;
- validates the content contract;
- sorts editions newest first;
- rebuilds every dated snapshot from its own JSON;
- renders the newest edition at dist/index.html;
- derives the archive and Editions menu automatically;
- copies shared assets to dist/assets/.

The build never regenerates `data/news-index.json`; stale generated state must be fixed explicitly with `npm run news:index`. `dist/` is intentionally ignored by Git. It is a reproducible build artifact, not an editorial source.

## Verification checklist

- Root shows the newest edition_date.
- Each date route shows the matching edition, without redirecting to root.
- Archive is newest-first and includes every JSON file.
- AUTO, LIGHT, and DARK themes work.
- Vietnamese text is intact.
- No horizontal overflow at 360, 412, 768, 1440, or 1920 CSS pixels.
- Source links open in a new tab with noopener noreferrer.
- Unknown visual keys use the neutral fallback.

## Build failures

Validation errors include the source filename and field path, for example:

    ERROR [MISSING_REQUIRED_FIELD] content/2026-08-24.json headline
    Missing required field.

Fix the JSON and run the build again. The renderer ignores unknown optional fields but rejects missing required content and unsupported enum values.
