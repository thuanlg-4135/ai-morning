# Event identity and content rules

Use these rules when selecting, indexing, moving, or writing items in an edition.

## Stable event identity

For every candidate, create a stable `event_id` that describes the real-world change, not the headline. Example: `github-copilot-agent-plugins-ga`, not `github-news-today`.

Create an `event_signature` with four canonical kebab-case fields:

- `organization`
- `product`
- `action`
- `artifact`

Use the most accurate signature for each occurrence. A material update may evolve action or artifact, such as preview to general availability, but organization and product must still resolve to the same identity.

Use only the validator's canonical action vocabulary. Do not invent tense or synonym variants such as `released`, `open-sourced`, or `went-live`. Common actions include:

`release`, `launch`, `general-availability`, `preview`, `beta`, `production`, `deployment`, `open-source`, `pricing`, `roadmap`, `deprecation`, `acquisition`, `partnership`, `funding`, `integration`, `research-publication`, `benchmark-result`, `security-advisory`, `incident`, `incident-resolution`, `regulation`, `policy-change`, `feature-update`, `model-update`, `version-update`, `migration`, and `correction`.

## Same-event test

Consider two reports the same event when they share most of:

- organization and product;
- model or version;
- action such as launched, deprecated, priced, acquired, or benchmarked;
- effective date;
- primary or canonical source.

Merge same-event reports into one candidate and attach multiple sources. A second article is additional evidence, not another item.

## Material updates

An indexed event may return only when there is a concrete delta, such as:

- status transition;
- changed availability, price, version, region, or scope;
- independent confirmation or correction;
- incident outcome;
- another verifiable material change.

Reuse the same `event_id`, add a concrete `material_update`, and set `update_kind` to one of:

`status-change`, `availability-change`, `version-change`, `pricing-change`, `scope-change`, `independent-confirmation`, `correction`, `incident-resolution`, or `other-material-change`.

A returning occurrence needs structural evidence: either a canonical source URL not seen earlier, or a later item `published_at` backed by a later source `published_at`.

Known tracking parameters count as the same canonical source. Unknown query parameters are preserved by default because they may identify distinct resources. Host-specific IDs such as YouTube `v`, Hacker News `id`, OpenReview `id`, and SSRN `abstract_id` remain authoritative.

`independent-confirmation` requires a chronologically later reporting or research source from a publisher host not used earlier for that event. Typed changes must carry the matching semantic delta. Commentary, renewed social attention, self-asserted timestamps, and unchanged-source rewrites are not material updates.

## One event, one home

An `event_id` may appear in only one primary section:

- `brief`: a smaller distinct event;
- `trends`: a developed analysis;
- `releases`: a structured product change;
- `radar`: a distinct forward-looking signal grounded in sources.

The hero, dek, memo, and takeaway may synthesize the edition, but must not restate all facts from a story. Never repeat an event across primary sections. If a release drives the main analysis, include its release facts in the trend and omit a separate release card.

## Required fields and freshness

Every brief, trend, release, and radar item must include:

- a unique stable `event_id`;
- an `event_signature`;
- `published_at` beginning with `YYYY-MM-DD`, preferably a full ISO timestamp;
- freshness matching the verified window;
- at least one `sources` entry;
- direct URL, label, type, and `published_at` for every source.

A returning event must also include `material_update` and `update_kind`.

Briefs require distinct `title` and explanatory `text`. Trends require at least two substantive paragraphs, a practical `action`, and sources. Releases require a summary, audience or impact context, verdict, and evidence. Radar items must be meaningful sentences and cannot repeat confirmed news from another section. Do not pad copy to cross a word threshold.

Full timestamps must fall inside the exact half-open window ending at the effective cutoff: the prior 24 hours for `NEW_TODAY` or prior 72 hours for `CONTEXT_72H`. Optional `meta.generated_at` must contain the actual zoned generation time. When present, `meta.cutoff_at` and `meta.window_started_at` must describe that effective window.

A date-only value may use the documented calendar fallback. A date-only value on the edition date is rejected because it cannot prove the event existed before cutoff. Source dates follow the same freshness window as their item.

For developed trends, optional `editorial_theme` and `editorial_angle` use kebab case. Reusing a lead theme across the previous three editions produces a warning. Reusing the same theme and angle produces a stronger warning. `editorial_repeat_reason` documents an intentional return but never bypasses duplicate or material-update rules.

Trend `strength` must be one of `EARLY_SIGNAL`, `EMERGING`, `ACCELERATING`, or `ESTABLISHED`.
