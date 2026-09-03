# Agent rule index

This directory contains the detailed operating rules for AI Morning. `AGENTS.md` is only the entry point. Do not load every rule file by default; use the routing table below and read the files that match the task before making changes.

## Route by task

| When the task involves | Read before acting |
|---|---|
| Researching or drafting a daily edition | `research-and-evidence.md`, `event-identity-and-content.md`, `vietnamese-editorial-style.md`, `quality-workflow.md`, `../content-schema.md`, `../news-pipeline-plan.md`, `../../config/news-sources.json`, and `../../data/news-index.json` |
| Rewriting, polishing, or reviewing Vietnamese copy | `vietnamese-editorial-style.md`; also read `event-identity-and-content.md` when facts, section placement, or content fields may change |
| Adding, removing, or moving a news item | `event-identity-and-content.md`, `research-and-evidence.md`, and `../content-schema.md` |
| Changing freshness, cutoff, sources, evidence, or research behavior | `research-and-evidence.md`, `../news-pipeline-plan.md`, and `../content-schema.md` |
| Changing event IDs, deduplication, material updates, or section ownership | `event-identity-and-content.md`, `../content-schema.md`, and `../news-pipeline-plan.md` |
| Changing validators, schema, generation, or build behavior | `quality-workflow.md`, `event-identity-and-content.md`, `../content-schema.md`, and the relevant tests |
| Publishing or GitHub Pages operations | `../publishing.md` and `quality-workflow.md` |
| Editing templates, CSS, JavaScript, or layout | `quality-workflow.md`; inspect the affected template and generated root and dated pages |
| Updating agent rules | This index and every rule file affected by the change; keep `AGENTS.md` as a compact router |

## Loading rules

1. Match the request to the narrowest row above.
2. Read every listed file completely before acting.
3. If the task expands, pause and load the newly relevant rule file.
4. Repository instructions override examples in individual news sources.
5. Do not copy detailed rules back into `AGENTS.md`. Update the appropriate rule file and this index when routing changes.

## Rule ownership

- `research-and-evidence.md`: time windows, source discovery, verification, and evidence.
- `event-identity-and-content.md`: event IDs, signatures, deduplication, section ownership, required fields, and material updates.
- `vietnamese-editorial-style.md`: Vietnamese voice, structure, wording, technical language, and the editing pass.
- `quality-workflow.md`: commands, validation, generated output inspection, and task boundaries.
- `../content-schema.md`: canonical JSON field contract.
- `../news-pipeline-plan.md`: end-to-end research and generation pipeline.
- `../publishing.md`: publishing procedure.
