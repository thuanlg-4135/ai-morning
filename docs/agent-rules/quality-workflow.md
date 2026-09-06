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

## Presentation and visual-regression workflow

Functional QA and visual QA are separate gates. A green build, zero overflow, and passing Playwright interactions do not prove that composition, hierarchy, spacing, color, or editorial character improved.

For any change to templates, CSS, layout, typography, theme colors, or visual treatment:

1. Start from the current production baseline. Do not redesign unrelated areas as part of a polish task.
2. Keep the PR narrow: one visual concern or one tightly related group of selectors. Avoid blanket override stylesheets that restyle unrelated sections.
3. Preserve established identity unless the task explicitly asks to change it. In particular, do not casually alter the masthead, hero proportions, edition strip, or main editorial section structure.
4. Run the normal build and browser suite before merge.
5. Inspect actual screenshots, not only computed styles. At minimum review 360px, 768px, and 1440px; review light and dark mode whenever theme-sensitive styles changed.
6. Ensure lazy editorial images are fully loaded before judging screenshots. Placeholder blocks are a capture failure, not evidence of acceptable visual output.
7. Compare hierarchy, whitespace, line length, image weight, section transitions, and first-viewport composition against the production baseline.
8. If the result is visually worse or ambiguous, revise or revert the PR. Do not layer additional speculative CSS on top of a regression.
9. Merge only after both functional checks and visual review pass. After merge, confirm the production Pages workflow succeeds.

Prefer small independently revertible changes. A presentation pass should be easy to roll back without touching content, schema, or unrelated UI.

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
