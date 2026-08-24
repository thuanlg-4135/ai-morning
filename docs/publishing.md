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
2. Run `npm run news:index` to validate events and regenerate the cross-edition news ledger.
3. Run npm run build.
4. Serve and verify the generated site:

       cd dist
       python -m http.server 8080

5. Check /, /YYYY-MM-DD/, older date routes, and /archive/.
6. Commit the JSON file together with `data/news-index.json`. Templates, CSS, JavaScript, and generated HTML do not need daily edits.
7. Push to main. GitHub Actions validates, builds the site and uploads only dist/.

## Build behavior

npm run build:

- runs the news-quality regression suite;
- checks that every item has event identity, source evidence, adequate depth and valid freshness;
- rejects duplicate or likely duplicate events and a stale `data/news-index.json`;
- scans every content/*.json file;
- validates the content contract;
- sorts editions newest first;
- rebuilds every dated snapshot from its own JSON;
- renders the newest edition at dist/index.html;
- derives the archive and Editions menu automatically;
- copies shared assets to dist/assets/.

dist/ is intentionally ignored by Git. It is a reproducible build artifact, not an editorial source.

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

    ERROR content/2026-08-24.json:
    missing required field "headline"

Fix the JSON and run the build again. The renderer ignores unknown optional fields but rejects missing required content and unsupported enum values.
