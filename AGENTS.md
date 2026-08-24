# AI Morning agent instructions

These rules apply to every task in this repository. The product is a Vietnamese daily briefing for software engineers; freshness, evidence, and non-repetition are more important than filling every section.

## Before researching an edition

1. Read `docs/content-schema.md`, `docs/news-pipeline-plan.md`, `config/news-sources.json`, and `data/news-index.json`.
2. Define the edition cutoff as 07:00 Asia/Ho_Chi_Minh on `edition_date`. The primary scan covers the preceding 24 hours; context may look back at most 72 hours.
3. Search the event index before drafting. Treat matching product/version, organization, action, artifact, and canonical source URL as the same event even when headlines differ.
4. Never copy the previous edition as a content starting point. Start from an empty candidate list.

Published edition files are the durable input to the generated event ledger. Do not prune or rename old editions as routine cleanup; if archival is ever required, preserve their event signatures in an explicit migration instead of silently erasing duplicate memory.

## Research broadly

Use live web research for every edition. Do not rely on model memory, search-result snippets, another newsletter, or a single vendor feed.

Search at least these source groups:

- Primary model/platform sources: OpenAI, Anthropic, Google DeepMind, Google AI Developers, Meta AI, Mistral, Microsoft AI, AWS Machine Learning, Azure AI, NVIDIA Developer, Hugging Face, Qwen, DeepSeek, and other major labs when their primary pages are accessible.
- Developer tooling: GitHub Changelog, VS Code, Vercel Changelog, Cloudflare, JetBrains, Cursor, major agent tools, PyPI/package registries, runtime release notes and official GitHub release pages.
- Operations and security: vendor status histories, GitHub advisories, CISA/NIST, incident reports, and security release notes that can confirm operational or vulnerability claims.
- Research and standards: original papers, arXiv metadata, lab publications, NIST and relevant standards or regulator pages.
- Independent reporting: Reuters and other reputable reporting for corporate, policy, funding, security or disputed claims. Use specialist outlets for discovery and context, then find the primary source.
- Discovery only: Hacker News, Reddit, Product Hunt, social posts and aggregator newsletters. These can surface candidates but cannot be the sole evidence for a factual item.

Vary queries by organization, product, event type, date, and domain. Check official changelogs directly because general search often misses them. Record failed or quiet source groups in research notes instead of inventing a story.

## Verify every candidate

Open the source page and confirm all of the following before using it:

- canonical article URL, not a search page or generic homepage;
- visible publication or update date and, when available, timestamp/time zone;
- exact timestamp is strictly before the 07:00 Asia/Ho_Chi_Minh edition cutoff; reject events at the cutoff, future-scheduled pages, and pre-accessible pages;
- the source explicitly supports the stated change, number, availability and product/version name;
- the event falls inside the edition window or is honestly labelled `CONTEXT_72H`;
- rumors, leaks and unnamed-source reporting are labelled as reported or speculative, never confirmed;
- consequential or disputed claims have two independent sources;
- product announcements use an official primary source whenever one exists.

Do not cite a page solely because its title resembles the claim. Do not infer a release date from a crawl date. Do not turn an absence of release notes into a factual product story.

## Index events before writing

For every candidate, create a stable `event_id` describing the real-world change, not the article headline. Example: `github-copilot-agent-plugins-ga`, not `github-news-today`.

Also create an `event_signature` with four canonical kebab-case fields: `organization`, `product`, `action`, and `artifact`. Use the most accurate signature for each occurrence. A legitimate material update may evolve action or artifact (for example, preview to general availability), but organization and product must still resolve to the same identity. The validator normalizes common organization/product suffixes, clusters related artifacts across adjacent publication dates, and blocks an identical signature assigned to different event IDs.

Use only the validator's canonical action vocabulary; do not invent tense or synonym variants such as `released`, `open-sourced`, or `went-live`. Common choices are `release`, `launch`, `general-availability`, `preview`, `beta`, `production`, `deployment`, `open-source`, `pricing`, `roadmap`, `deprecation`, `acquisition`, `partnership`, `funding`, `integration`, `research-publication`, `benchmark-result`, `security-advisory`, `incident`, `incident-resolution`, `regulation`, `policy-change`, `feature-update`, `model-update`, `version-update`, `migration`, and `correction`.

Consider two reports the same event when they share most of:

- organization and product;
- model or version;
- action such as launched, deprecated, priced, acquired or benchmarked;
- effective date;
- primary/canonical source.

Merge same-event reports into one candidate and attach multiple sources. A second article is additional evidence, not another news item.

An indexed event may return only when there is a material update: status transition, changed availability, new price/version/region, independent confirmation or correction, incident outcome, or another concrete delta. Reuse the same `event_id`, add a concrete `material_update`, and classify it with `update_kind` (`status-change`, `availability-change`, `version-change`, `pricing-change`, `scope-change`, `independent-confirmation`, `correction`, `incident-resolution`, or `other-material-change`). The returning occurrence must also have structural evidence: either a canonical source URL not seen on earlier occurrences, or a later item `published_at` backed by a later `published_at` on an already indexed source. Tracking and unknown query-string variants count as the same canonical source; known resource IDs such as a YouTube video ID remain distinct. `independent-confirmation` always requires a chronologically later `reporting` or `research` source from a publisher host not used earlier for that event. Typed changes must carry the matching semantic delta: pricing changes need a changed pricing artifact, incident resolutions must move to the resolution action, and status/version/scope/availability changes must alter their relevant structured identity. Commentary, renewed social attention, self-asserted timestamps, and unchanged-source rewrites are not material updates.

## One event, one home

An `event_id` may appear in only one primary section of an edition:

- `brief` for a smaller distinct event;
- `trends` for a developed analysis;
- `releases` for a structured product change;
- `radar` only for a distinct forward-looking signal grounded in sources.

The hero, dek, memo, and takeaway may synthesize the edition, but must not restate all facts from a story. Never repeat an event in brief + trend, trend + release, or release + radar. If a product release drives the main analysis, put its release facts inside that trend and omit a separate release card.

## Required content fields

Every brief, trend, release, and radar item must include:

- unique stable `event_id`;
- structured `event_signature` with organization, product, action, and artifact;
- `published_at` beginning with `YYYY-MM-DD` (full ISO timestamp preferred);
- freshness matching the verified publication window;
- at least one `sources` entry;
- each source's direct URL, label, type and `published_at`.

When an existing `event_id` returns, it must additionally include `material_update` and `update_kind` and meet the structural-evidence rule above.

Briefs require distinct `title` and `text` fields. Write at least 40 words of explanatory body. Trends need at least 200 words across their paragraphs. Releases need at least 75 words across their change and verdict copy. Radar items need at least 12 words and cannot repeat confirmed news from another section.

Full timestamps must fall inside the exact half-open window: the prior 24 hours for `NEW_TODAY` or prior 72 hours for `CONTEXT_72H`, ending at the cutoff. A date-only value may use the documented calendar fallback, but a date-only value on the edition date is rejected because it cannot prove the event existed before 07:00. Source publication dates follow the same freshness window as their item.

Write in clear Vietnamese. Lead with the verified change, distinguish fact from analysis, explain why a software engineer should care, and include a practical implication. Fewer strong stories are preferable to recycled context on a quiet day.

## Quality workflow

After editing content, always run:

```text
npm run news:index
npm run build
```

`npm run news:index` validates evidence, depth, exact freshness windows, structured event identity, canonical source reuse, same-edition duplicates, normalized semantic aliases across adjacent dates, and likely title near-duplicates across 14 days. It then regenerates `data/news-index.json`.

The normal build checks that the index is current and must remain failing when content violates a news-quality rule. Do not bypass the validator, weaken a threshold to make a draft pass, or use `dedupe_override_reason` without documenting the concrete reason the two events are different.

When changing the validator itself, run `npm run test:news`; the normal build also runs this regression suite.

Before handing off, inspect the generated root page and each changed dated page. Confirm that brief titles have readable body copy, source links point to the cited pages, and no fact is presented more than once.
