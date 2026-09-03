# AI Morning agent instructions

These rules apply to every task in this repository. The product is a Vietnamese daily briefing for software engineers; freshness, evidence, and non-repetition are more important than filling every section.

## Before researching an edition

1. Read `docs/content-schema.md`, `docs/news-pipeline-plan.md`, `config/news-sources.json`, and `data/news-index.json`.
2. Define the scheduled cutoff as 07:00 Asia/Ho_Chi_Minh on `edition_date`, then use `effective_cutoff = min(scheduled_cutoff, meta.generated_at or the actual run time)`. The primary scan covers the preceding 24 hours; context may look back at most 72 hours.
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
- exact timestamp is strictly before the effective cutoff; reject events at the cutoff, after the actual generation time, future-scheduled pages, and pre-accessible pages;
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

An indexed event may return only when there is a material update: status transition, changed availability, new price/version/region, independent confirmation or correction, incident outcome, or another concrete delta. Reuse the same `event_id`, add a concrete `material_update`, and classify it with `update_kind` (`status-change`, `availability-change`, `version-change`, `pricing-change`, `scope-change`, `independent-confirmation`, `correction`, `incident-resolution`, or `other-material-change`). The returning occurrence must also have structural evidence: either a canonical source URL not seen on earlier occurrences, or a later item `published_at` backed by a later `published_at` on an already indexed source. Known tracking parameters count as the same canonical source, but unknown query parameters are preserved by default because they may identify distinct resources; host-specific IDs such as YouTube `v`, Hacker News `id`, OpenReview `id`, and SSRN `abstract_id` remain authoritative. `independent-confirmation` always requires a chronologically later `reporting` or `research` source from a publisher host not used earlier for that event. Typed changes must carry the matching semantic delta: pricing changes need a changed pricing artifact, incident resolutions must move to the resolution action, and status/version/scope/availability changes must alter their relevant structured identity. Commentary, renewed social attention, self-asserted timestamps, and unchanged-source rewrites are not material updates.

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

Briefs require distinct `title` and explanatory `text` fields; tiny fragments are hard errors, while unusually short or long copy is a warning. Trends require at least two substantive paragraphs, a practical `action`, and sources; releases require summary, audience/impact context, verdict, and evidence. Radar items must be meaningful sentences and cannot repeat confirmed news from another section. Do not pad copy to cross a word threshold.

Full timestamps must fall inside the exact half-open window: the prior 24 hours for `NEW_TODAY` or prior 72 hours for `CONTEXT_72H`, ending at the effective cutoff. Set optional `meta.generated_at` to the real zoned generation timestamp; when present, `meta.cutoff_at` and `meta.window_started_at` must describe that effective window. A date-only value may use the documented calendar fallback, but a date-only value on the edition date is rejected because it cannot prove the event existed before the effective cutoff. Source publication dates follow the same freshness window as their item.

For developed trends, optionally record kebab-case `editorial_theme` and `editorial_angle`. Reusing a lead theme across the previous three editions produces a warning; reusing the same theme and angle produces a stronger warning. `editorial_repeat_reason` may document an intentional return, but never bypasses factual duplicate or material-update rules. Trend `strength` must be one of `EARLY_SIGNAL`, `EMERGING`, `ACCELERATING`, or `ESTABLISHED`.

## Vietnamese editorial style

Write for a busy Vietnamese software engineer who wants to understand the news on the first read. The reader knows software development, but should not need to decode research-paper prose, vendor language, or a chain of untranslated English terms.

Use an inverted-pyramid structure at both story and paragraph level:

1. State the verified change in plain Vietnamese.
2. Explain what it changes for a developer or team.
3. Add only the technical detail needed to support that explanation.
4. End with a concrete implication, limitation, or next step.

Prefer natural Vietnamese sentence structure:

- Put the actor and action early: `Cursor cho phép...`, `GitHub đã thêm...`, `Nhóm phát triển cần...`.
- Keep one main idea per sentence. Aim for 12–24 words; split a sentence before it exceeds roughly 30 words.
- Keep paragraphs to 2–3 sentences. Each paragraph must have one job: news, meaning, evidence, caveat, or action.
- Use active voice and specific verbs. Replace abstract phrases such as `thực hiện việc`, `có khả năng giúp`, or `được xem là` with the direct action when evidence allows it.
- Front-load the useful fact. Do not begin with throat-clearing phrases such as `Điểm đáng chú ý là`, `Trong bối cảnh hiện nay`, or `Có thể thấy rằng`.
- Use concrete nouns, numbers, products, and actions instead of promotional adjectives or vague claims.
- Address the reader as `bạn` only when giving a direct action. Otherwise use `developer`, `nhóm phát triển`, or `team` consistently.

Handle technical language deliberately:

- Keep product names and widely understood terms such as API, model, token, prompt, runtime, benchmark, latency, cache, CLI, and IDE.
- Explain a less familiar term in plain Vietnamese at first use. Example: `control plane, tức lớp điều phối agent`.
- Do not put more than two unexplained English technical terms in one sentence.
- Prefer a clear Vietnamese phrase when it is equally precise: `mạng nội bộ` instead of `internal network`, `quyền tối thiểu` instead of `least privilege`, `chi phí cho mỗi task hoàn thành` instead of `cost per completed task`.
- Do not translate mechanically when the Vietnamese term would be less recognizable to a software engineer.

Avoid common AI-writing patterns:

- Do not stack clauses with repeated `nhưng`, `đồng thời`, `trong khi`, `không chỉ... mà còn...`, or semicolons.
- Do not repeat the same conclusion in the title, dek, body, memo, and takeaway.
- Do not turn every release into a broad industry trend. Say `đây là một tín hiệu` unless multiple independent events support a trend.
- Do not use hype, rhetorical questions, fake urgency, or claims such as `thay đổi cuộc chơi`, `đột phá`, `cách mạng`, and `đáng kinh ngạc` unless directly quoted and clearly attributed.
- Do not imitate the syntax of an English source. Understand the fact first, then rewrite it as Vietnamese.

Match copy depth to the section:

- `headline`: one clear idea, preferably no more than 18 words. Name the main change, not every theme in the edition.
- `dek`: no more than two sentences. Give the morning's main signal and its practical meaning.
- `brief.text`: 2–3 short sentences: what changed, who is affected, what to check.
- `trends.paragraphs`: paragraph 1 is the verified news; paragraph 2 explains impact and evidence; paragraph 3 gives a caveat or action. Do not combine these jobs into one dense paragraph.
- `release.summary`: describe the feature without analysis. Put audience in `who_gets_it`, consequence in `why_it_matters`, and recommendation in `verdict_note`.
- `radar.text`: identify what is still uncertain and what future evidence would change the assessment.
- `action`, memo items, and `takeaway`: start with a verb and make the next step testable.

Example of an overloaded sentence:

> Cursor bổ sung Self-Hosted Machines cho Cloud Agents: agent vẫn được điều phối từ Cursor nhưng tool execution có thể chạy trên máy nằm trong hạ tầng của chính team.

Rewrite it as:

> Cursor vừa bổ sung Self-Hosted Machines cho Cloud Agents. Cursor vẫn điều phối agent, còn các công cụ chạy trên máy của team.

Before finalizing Vietnamese copy, perform a separate editing pass:

1. Read only the first sentence of each paragraph. Together they must explain the whole story.
2. Split any sentence that carries more than one fact plus one conclusion.
3. Replace or explain unfamiliar English terms.
4. Remove repeated context and any sentence that does not change the reader's understanding or decision.
5. Read the copy aloud. Rewrite any sentence that needs a second breath or whose subject becomes unclear.
6. Confirm facts and analysis remain visibly distinct and every recommendation is supported by the cited evidence.

Fewer strong stories are preferable to recycled context on a quiet day. Clarity is more important than sounding sophisticated.

## Quality workflow

After editing content, always run:

```text
npm run test:news
npm run news:index
npm run news:check
npm run build
```

`npm run news:index` validates evidence, structural depth, exact freshness windows, structured event identity, canonical source reuse, same-edition duplicates, normalized semantic aliases, editorial fatigue, and likely title near-duplicates inside the bounded 14-day comparison window. It then explicitly regenerates `data/news-index.json`. `npm run news:check` performs the same validation and fails when the ledger is stale without rewriting it.

The normal build runs tests, quality/schema validation, and the stale-ledger check before rendering; it never regenerates the ledger silently. Hard failures protect schema, factual integrity, evidence, freshness, event identity, duplicates, and material updates. Editorial-theme fatigue and unusual length are warnings only. Do not bypass the validator or use `dedupe_override_reason` without documenting the concrete reason the two events are different.

When changing the validator itself, run `npm run test:news`; the normal build also runs this regression suite.

Before handing off, inspect the generated root page and each changed dated page. Confirm that brief titles have readable body copy, source links point to the cited pages, and no fact is presented more than once.

The normal daily edition remains data-only: research, edit `content/YYYY-MM-DD.json`, run the commands above, and commit the JSON plus generated ledger. Do not touch templates, CSS, JavaScript, validators, or schema documentation unless the contract itself changes.
