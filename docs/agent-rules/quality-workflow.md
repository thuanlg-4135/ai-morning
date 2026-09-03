# Quality workflow and task boundaries

Use these rules for content changes, validators, builds, publishing, templates, CSS, JavaScript, and handoff.

## Required checks

After editing content, run:

```text
npm run test:news
npm run news:index
npm run news:check
npm run build
```

`npm run news:index` validates evidence, structural depth, exact freshness windows, structured event identity, canonical source reuse, same-edition duplicates, normalized semantic aliases, editorial fatigue, and likely title near-duplicates inside the bounded 14-day comparison window. It then regenerates `data/news-index.json`.

`npm run news:check` performs the same validation and fails when the ledger is stale without rewriting it.

The normal build runs tests, quality and schema validation, and the stale-ledger check before rendering. It never regenerates the ledger silently.

Hard failures protect schema, factual integrity, evidence, freshness, event identity, duplicates, and material updates. Editorial-theme fatigue and unusual length are warnings only. Do not bypass the validator or use `dedupe_override_reason` without documenting why two events differ.

When changing the validator, run `npm run test:news`. The normal build also runs this regression suite.

## Inspect generated output

Before handoff, inspect:

- the generated root page;
- every changed dated page;
- brief titles and their body copy;
- source links and cited pages;
- repeated facts across sections;
- mobile and desktop layout when templates, CSS, or JavaScript changed.

## Daily-edition boundary

A normal daily edition is data-only:

1. Research.
2. Edit `content/YYYY-MM-DD.json`.
3. Run the required checks.
4. Commit the edition JSON and generated ledger.

Do not touch templates, CSS, JavaScript, validators, or schema documentation unless the contract or presentation behavior itself changes. Do not expand a copy task into a layout or platform refactor.

## Rule maintenance

When a repository rule changes:

1. Update the narrowest file under `docs/agent-rules/`.
2. Update `docs/agent-rules/index.md` only when routing or ownership changes.
3. Keep `AGENTS.md` compact and free of duplicated detail.
4. Verify every referenced path exists and is reachable from the repository root.
