# AI Morning agent instructions

AI Morning is a Vietnamese daily technology briefing for software engineers. Freshness, evidence, clarity, and non-repetition matter more than filling every section.

This file is the repository entry point. Detailed rules live under `docs/agent-rules/`.

## Start here

Before acting:

1. Read `docs/agent-rules/index.md`.
2. Match the task to its routing table.
3. Read every rule and contract file listed for that task.
4. If the task expands, stop and load the newly relevant rules before continuing.

Do not load unrelated rule files by default. Do not duplicate detailed rules in this file.

## Quick routing

| Task | Primary route |
|---|---|
| Research or draft an edition | `docs/agent-rules/research-and-evidence.md` |
| Add, remove, deduplicate, or move an item | `docs/agent-rules/event-identity-and-content.md` |
| Write, rewrite, or review Vietnamese copy | `docs/agent-rules/vietnamese-editorial-style.md` |
| Validate, build, publish, or change runtime code | `docs/agent-rules/quality-workflow.md` |
| Change JSON fields or data contracts | `docs/content-schema.md` |
| Change the research or generation pipeline | `docs/news-pipeline-plan.md` |
| Publish to GitHub Pages | `docs/publishing.md` |
| Change repository rules | `docs/agent-rules/index.md` |

The quick table identifies the first relevant file. The complete list of required files is in `docs/agent-rules/index.md`.

## Always-on constraints

- Use live research for every daily edition.
- Verify publication time, factual claims, availability, and direct source URLs.
- Search `data/news-index.json` before drafting and do not repeat an indexed event without a verifiable material update.
- Start each edition from an empty candidate list. Never copy the previous edition as a content starting point.
- Keep one event in one primary section.
- Separate verified facts, analysis, and recommendations.
- Prefer fewer strong stories to filler.
- Write Vietnamese that a busy software engineer can understand on the first read.
- A normal daily edition is data-only. Do not change templates, CSS, JavaScript, validators, or schema documentation unless the task explicitly changes the contract or presentation behavior.
- Never bypass validation to make an edition pass.

## Required content checks

After changing edition content, run the commands defined in `docs/agent-rules/quality-workflow.md`:

```text
npm run test:news
npm run news:index
npm run news:check
npm run build
```

Inspect the generated root page and every changed dated page before handoff.

## Maintaining these instructions

Put new detail in the narrowest matching file under `docs/agent-rules/`. Update the rule index when a new situation, route, or ownership boundary is introduced. Keep this file short enough for an agent to identify the correct route quickly.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
