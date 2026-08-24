# AI Morning news quality and scale plan

## Goal

Publish a useful Vietnamese AI briefing every morning without repeating the same event across sections or editions. Each published claim should be traceable to a timely source, and every story should give the reader enough context to understand what changed, why it matters, and what to do next.

The static GitHub Pages renderer can remain. The missing layer is a repeatable pipeline before `content/YYYY-MM-DD.json` is built.

## Implemented foundation

The first enforceable slice now exists:

- `config/news-sources.json` is the tiered research registry;
- `data/news-index.json` is the generated cross-edition event ledger;
- `scripts/news-quality.mjs` checks identity, timestamps, evidence, depth, canonical URLs, same-edition placement, normalized signature aliases, structurally evidenced cross-edition updates, and likely title duplicates;
- `npm run build` runs the validator regression suite and refuses stale index data before rendering.

The ingestion, raw-entry storage, richer claim mapping, and scheduled review queue described below remain future phases.

## Pre-change baseline audit — 25 August 2026

The observations in this section describe the repository before the implemented foundation above; they are retained to explain why the work was necessary.

- The repository contains four manually authored editions and no feed ingestion, event clustering, cross-edition memory, or editorial quality gate.
- The publishing instructions recommend copying the previous edition. This makes yesterday's framing and story selection easy to carry forward.
- Across the four editions there are 34 citations, but only 18 unique URLs from 11 domains.
- On 25 August, `Slack Code` occurs nine times. The same Slack announcement is cited by both trends and the release entry.
- The 25 August edition has about 593 editorial words, two trends, one release, and five citations. Most of it develops one Slack event from several angles.
- Briefs may contain only `text`. The renderer then turns that entire text into the bold title and renders no explanatory body. This creates a page that looks like highlighted fragments rather than a readable briefing.
- Source arrays are optional for trends and releases, and briefs, radar claims, the headline, dek, memo, and takeaway have no claim-to-source relationship.
- `NEW_TODAY` and `CONTEXT_72H` are labels supplied by the author. The build does not validate a source publication time, first-seen time, or material update.

## Editorial contract

### One event, one home

Each real-world event receives a stable `event_id` and one primary placement in an edition:

- `brief`: a distinct minor event that does not get a full story;
- `trend`: an event or cluster that deserves analysis;
- `release`: a product change that benefits from a structured availability/verdict block;
- `radar`: a genuinely forward-looking item, not a restatement of a confirmed release.

A story may be mentioned in the hero or takeaway only as a short link to its primary placement. It must not be rewritten as another standalone item. A release that is the evidence for a trend should be embedded as a fact block inside the trend instead of appearing again in the release notebook.

### Material-update rule

An event published in a previous edition is excluded unless there is a material delta, such as:

- availability changes from preview to GA;
- a new model, region, price, benchmark, policy, incident, or integration is announced;
- an independent source confirms, disproves, or materially extends the earlier report.

When an event returns, the copy must state the delta first and link to the earlier edition for background. A new article about the same unchanged announcement is not a new event.

### Minimum useful depth

- Brief: title plus at least 40 words covering what changed and why it matters.
- Main story: at least 200 words, normally 220–500, with facts, context, impact, and a practical implication.
- Release: at least 75 words across the change, audience, impact, verdict, and source-backed caution; dedicated `what_changed` and `why_it_matters` fields are preferred when they improve clarity.
- Quiet day: fewer stories is acceptable; recycled context must not be used to fill space.

The target is 4–7 distinct events per normal edition, with 1–3 developed stories. Source diversity is a quality signal, not a quota: a weak story should not be published merely to hit the target.

## Pipeline design

```text
source registry
      ↓
fetch raw entries
      ↓
normalize URL, time, entities, product and event type
      ↓
exact duplicate removal
      ↓
near-duplicate event clustering + cross-edition novelty check
      ↓
rank by freshness, impact, confidence and reader relevance
      ↓
compose one placement per event
      ↓
quality gate
      ↓
content/YYYY-MM-DD.json → existing static build → GitHub Pages
```

The current foundation uses the first, third, and fourth paths below. As ingestion is added, keep raw inputs and editorial output separate:

- `config/news-sources.json`: source name, tier, topics, kind, and canonical entry URL;
- `data/raw/YYYY-MM-DD/*.json`: immutable fetched metadata and excerpts;
- `data/news-index.json`: current generated event ledger; a later ingestion layer may add a raw append-only event store;
- `content/YYYY-MM-DD.json`: the human-readable edition that the current renderer consumes;
- `scripts/news/`: fetch, normalize, cluster, rank, compose, and validate commands.

Do not commit full copyrighted article bodies. Store URL, title, author, timestamps, short excerpt, source metadata, hashes, and derived event fields.

## Source expansion

Start with feeds and changelogs that have stable timestamps and canonical URLs.

### Tier 1 — primary

- Model/platform vendors: OpenAI, Anthropic, Google DeepMind, Meta AI, Mistral, Microsoft AI, AWS, Google Cloud, Azure, NVIDIA and Hugging Face.
- Developer products: GitHub, Vercel, Cloudflare, Slack, JetBrains, Cursor and major agent-tool vendors.
- Research and standards: arXiv category feeds, major lab publications, NIST and relevant standards bodies.
- Security and operations: vendor security advisories, status pages and release repositories.

### Tier 2 — independent reporting

- Reuters and other high-reputation general reporting for company, policy and market claims.
- The Verge, TechCrunch, Ars Technica and selected specialist outlets for product reporting and independent context.

### Tier 3 — discovery only

- Hacker News, GitHub Trending, Reddit, Product Hunt and social posts may surface candidates, but should not be the sole evidence for a factual story.

Use RSS/Atom or an official API where available. Parse an HTML page only when no stable feed exists. Apply per-source rate limits, conditional requests (`ETag`/`Last-Modified`), retries, and a visible fetch-health report.

## Duplicate prevention

Apply four gates in order:

1. **Canonical URL:** remove tracking parameters, normalize host/path, follow redirects, and honor canonical links.
2. **Exact content:** hash normalized source, title, and publication date; reject an already-seen hash.
3. **Event cluster:** compare normalized title tokens, named entities, product/version, event type, source overlap, and a text-similarity score. Merge reports about the same announcement into one event with multiple sources.
4. **Edition placement:** fail validation when one `event_id` appears in more than one primary section or when a previously published event lacks `material_update`, `update_kind`, and either a genuinely new canonical source or a newer item timestamp backed by a newer source timestamp.

Begin with transparent token/entity scoring so decisions can be inspected. Add embeddings only after a labelled set shows that deterministic clustering misses too many paraphrases.

Every cluster decision should record `matched_by`, score, and the IDs it merged. Editors need an explicit `force_merge` and `force_separate` override.

## Accuracy and source quality gate

Extend schema version 2 with these fields:

- edition item: `event_id`, structured `event_signature`, `title`, `summary`, `why_it_matters`, `published_at`, `first_seen_at`, `freshness`, `sources`, and optional paired `material_update` plus `update_kind`;
- source: `url`, `canonical_url`, `publisher`, `type`, `published_at`, `retrieved_at`, and `supports` claim IDs;
- claim: stable ID, text, confidence (`confirmed`, `reported`, `speculation`), and supporting source IDs.

Block publication when:

- a factual item has no source;
- the source timestamp does not support `NEW_TODAY`;
- a product announcement lacks a primary source when one exists;
- a disputed, consequential, or provider-identity claim has fewer than two independent sources;
- a URL is unreachable, points to a homepage instead of the cited item, or duplicates another canonical URL;
- a claim is presented as confirmed while its source only reports a rumor;
- a brief has no separate title/body or a main story is below its depth threshold;
- an event appears in multiple primary sections;
- more than 30% of normal-edition items come from one publisher, unless an editor records an override reason.

The validator should print actionable file paths, event IDs, source URLs, and reasons, then exit non-zero before the existing site build runs.

## Reader experience changes

- Require separate brief titles and bodies so the title is bold and the explanation remains readable prose.
- Add a “read analysis” anchor when the hero or takeaway refers to an existing story.
- Show source publisher, publication date, and confidence close to the claim.
- Replace repeated source pills with one compact evidence block per event.
- Add “Updated since yesterday” only when a material delta exists, linking to the earlier edition.
- On quiet days, show a short transparent note about scan coverage and publish fewer, stronger items.

## Delivery plan

### Phase 0 — stop the visible repetition (1–2 days)

- Make `title` and `text` mandatory for briefs and render them separately.
- Add `event_id` to briefs, trends, releases, and radar.
- Add a build-time check for duplicate `event_id`, duplicate canonical source URL across primary placements, and repeated normalized titles.
- Restructure the current edition so Slack Code has one primary home; remove its restatements from brief, release, and radar.
- Add word-count and mandatory-source checks.

**Exit:** no event appears twice in one edition; no brief renders as a single all-bold paragraph; `npm run build` rejects a deliberately duplicated fixture.

### Phase 1 — event memory and editorial QA (3–5 days)

- Add the event ledger and a command that compares a draft with the previous 7–14 days.
- Implement the material-update rule and editor overrides.
- Add claim/source metadata, timestamp validation, URL reachability checks, and a generated QA report.
- Add fixtures and automated tests for exact duplicates, paraphrases, updates, stale sources, and quiet days.

**Exit:** a copied or paraphrased old event is blocked; a real update passes only with its delta stated; every published factual item has traceable evidence.

### Phase 2 — broaden collection (1 week)

- Build the source registry and adapters for the first 20–30 reliable RSS/Atom feeds and changelogs.
- Normalize and cluster candidates into a reviewable daily queue.
- Rank candidates using freshness, source tier, independent confirmation, technical relevance, and estimated reader impact.
- Generate a coverage report showing healthy, stale, and failing sources plus topic/vendor concentration.

**Exit:** at least 90% of registered sources are checked successfully; the review queue contains clusters rather than repeated articles; no publisher dominates by default.

### Phase 3 — automate safely (1 week)

- Add scheduled collection and a daily draft workflow while keeping publication behind review.
- Run ingestion, deduplication, source validation, content validation, build, and smoke tests in CI.
- Preserve raw metadata and QA reports as workflow artifacts.
- Add monitoring for source failure rate, candidates per run, cluster compression, unique events published, duplicate blocks, correction count, and edition word depth.

**Exit:** the system creates a source-backed draft on schedule, but cannot deploy an edition that fails any quality gate.

## Success metrics after 30 days

- Zero duplicate `event_id` values within a published edition.
- Fewer than 5% of published items flagged as cross-edition repeats without a material delta.
- 100% of factual items have at least one supporting source and valid publication timestamp.
- At least 70% of product claims use a primary source; consequential claims also have independent confirmation.
- Median normal edition contains at least five distinct events and two developed stories.
- No single publisher supplies more than 30% of items over a rolling seven-day window without a documented exception.
- Corrections and editor overrides are recorded and reviewable.

## Recommended first implementation slice

Implement Phase 0 before adding feeds. More inputs without event identity and publish gates would amplify the current repetition. Once one-event-one-home is enforced, Phase 1 creates the memory needed to prevent yesterday's news from becoming today's headline again; only then should collection scale outward.
