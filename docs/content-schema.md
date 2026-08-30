# AI Morning content schema

Daily editions live in content/YYYY-MM-DD.json. JSON files contain editorial content only; the renderer in scripts/build.mjs owns HTML, classes, layout, navigation, and accessibility markup.

The renderer schema remains version 1. The news-quality contract below additionally requires event identity, publication dates, and evidence metadata for every factual item.

## Required top-level fields

| Field | Type | Notes |
| --- | --- | --- |
| schema_version | number | Must be 1. |
| edition_date | string | ISO date (YYYY-MM-DD) and must match the filename. |
| headline | string | Main edition headline. |
| dek | string | Two- or three-sentence editorial summary. |
| brief | array | Short scan items with freshness and text. |
| trends | array | Main analysis items. |
| releases | array | Release notebook entries. |
| developer_memo | object | Practical actions and cautions. |
| radar | array | Compact forward-looking signals. |
| takeaway | string | Final short editorial conclusion. |

## Optional top-level fields

- locale: normally vi-VN.
- edition_type: normally daily_ai_catchup.
- meta: scan hours, context window, reading time, source policy, and optional zoned `generated_at`. When retained, `cutoff_at` and `window_started_at` must match the effective window.
- hero_visual: a visual hint consumed by the visual renderer.
- edition_mode: BIG, NORMAL, or QUIET. If omitted, the renderer infers a mode.
- edition_number: explicit issue number; otherwise derived chronologically.
- one_number: value, label, and optional context for the desktop newspaper rail.
- watching: short topic labels for the desktop newspaper rail.
- wildcard: optional closing item with title and text.
- content_contract: documentation metadata; ignored by the renderer.
- translations: optional reviewed locale overlays. `translations.en` creates the corresponding `/en/` page and must be complete when present.
- Unknown optional fields are ignored safely.

## Bilingual content

Vietnamese remains the canonical editorial record. A reviewed English edition is stored under `translations.en`; shared factual metadata (`event_id`, `event_signature`, timestamps, freshness, and source URLs) is never duplicated. News-item translations are objects keyed by `event_id`, so adding or reordering items cannot attach English copy to the wrong event.

The English overlay requires `headline`, `dek`, `takeaway`, a complete `developer_memo`, and complete entries for every item in `brief`, `trends`, `releases`, and `radar`. Trend paragraph counts and memo list lengths must match the Vietnamese edition. Optional Vietnamese fields such as `pullquote`, `who_gets_it`, `what_changed`, and `why_it_matters` also require English equivalents when they exist. Incomplete overlays fail schema validation instead of producing a mixed-language page.

Example:

    {
      "translations": {
        "en": {
          "headline": "English headline",
          "dek": "English editorial summary.",
          "brief": {
            "vendor-product-concrete-change": {
              "title": "English brief title",
              "text": "English explanatory body."
            }
          },
          "trends": {},
          "releases": {},
          "developer_memo": {
            "title": "English memo title",
            "direct_answer": "English direct answer.",
            "actions": ["English action."],
            "avoid": ["English caution."]
          },
          "radar": {},
          "takeaway": "English takeaway."
        }
      }
    }

The renderer publishes Vietnamese at `/YYYY-MM-DD/` and English at `/en/YYYY-MM-DD/`. Only fully translated editions appear in the English archive. The VI/EN control links between equivalent dated pages when both exist and otherwise returns to the latest translated English edition.

## Allowed enums

Freshness:

- NEW_TODAY
- CONTEXT_72H

Release verdict:

- TRY_NOW
- WATCH
- SKIP_FOR_NOW

Radar status:

- CONFIRMED
- WATCH
- LIKELY
- SPECULATION

Source type:

- official
- research
- reporting

Trend strength:

- EARLY_SIGNAL
- EMERGING
- ACCELERATING
- ESTABLISHED

## Nested structures

### Brief item

    {
      "event_id": "vendor-product-concrete-change",
      "event_signature": {
        "organization": "vendor",
        "product": "product",
        "action": "release",
        "artifact": "concrete-change"
      },
      "published_at": "2026-08-25T00:30:00Z",
      "freshness": "NEW_TODAY",
      "title": "Tiêu đề scan nhanh bắt buộc",
      "text": "Giải thích điều gì thay đổi và vì sao kỹ sư phần mềm nên quan tâm.",
      "sources": [
        {
          "label": "Tên bài hoặc changelog",
          "url": "https://example.com/direct-source",
          "type": "official",
          "published_at": "2026-08-24"
        }
      ]
    }

### Trend

    {
      "event_id": "vendor-product-concrete-change",
      "event_signature": {
        "organization": "vendor",
        "product": "product",
        "action": "launch",
        "artifact": "concrete-change"
      },
      "published_at": "2026-08-24",
      "id": "stable-slug",
      "freshness": "NEW_TODAY",
      "strength": "ACCELERATING",
      "importance": "LEAD",
      "editorial_theme": "agent-governance",
      "editorial_angle": "identity-and-access",
      "title": "Tiêu đề phân tích",
      "paragraphs": [
        "Đoạn văn thứ nhất.",
        "Đoạn văn thứ hai."
      ],
      "pullquote": "Pull quote tùy chọn.",
      "stat": {
        "value": "9,8%",
        "label": "ít bước thực thi hơn",
        "context": "Ngữ cảnh ngắn tùy chọn."
      },
      "action": "Hành động thực tế tùy chọn.",
      "visual": {
        "kind": "editorial",
        "key": "cost-down-system-up",
        "caption": "Caption ngắn."
      },
      "sources": [
        {
          "label": "Tên nguồn",
          "url": "https://example.com/source",
          "type": "official",
          "published_at": "2026-08-24"
        }
      ]
    }

id, importance, pullquote, stat, and visual are optional. `event_id`, `event_signature`, `published_at`, at least two developed paragraphs, a practical `action`, and a non-empty `sources` array are required by the news-quality validator. `importance` accepts `LEAD`, `SECONDARY`, or `BRIEF`. `strength` uses the four canonical values above. Optional `editorial_theme` and `editorial_angle` are free kebab-case labels used for warning-only lead-story fatigue checks; `editorial_repeat_reason` documents an intentional return but bypasses no factual gate. paragraphs is plain text; do not put HTML or presentation classes in it.

### Release

    {
      "event_id": "vendor-product-concrete-change",
      "event_signature": {
        "organization": "vendor",
        "product": "product",
        "action": "release",
        "artifact": "concrete-change"
      },
      "published_at": "2026-08-24",
      "product": "Product name",
      "feature": "Feature name",
      "freshness": "CONTEXT_72H",
      "status": "GA",
      "summary": "Release summary.",
      "who_gets_it": "Optional availability note.",
      "verdict": "WATCH",
      "verdict_note": "Why the reader should watch.",
      "sources": [
        {
          "label": "Direct release note",
          "url": "https://example.com/release",
          "type": "official",
          "published_at": "2026-08-24"
        }
      ]
    }

### Developer memo

    {
      "title": "Có cần đổi workflow hôm nay không?",
      "direct_answer": "Chưa cần thay đổi workflow hiện tại.",
      "actions": ["Việc nên thử."],
      "avoid": ["Việc chưa nên làm."]
    }

### Radar item

    {
      "event_id": "distinct-forward-looking-signal",
      "event_signature": {
        "organization": "vendor",
        "product": "product",
        "action": "roadmap",
        "artifact": "forward-looking-signal"
      },
      "published_at": "2026-08-24",
      "status": "WATCH",
      "text": "Tín hiệu cần theo dõi, khác với các sự kiện đã xuất hiện trong brief, trend hoặc release.",
      "sources": [
        {
          "label": "Evidence for the signal",
          "url": "https://example.com/evidence",
          "type": "research",
          "published_at": "2026-08-24"
        }
      ]
    }

## News identity and duplicate rules

- `event_id` identifies the real-world event, not a publisher's headline.
- `event_signature` requires canonical kebab-case `organization`, `product`, `action`, and `artifact` fields. Use the best signature for each occurrence; action or artifact may evolve for a valid material update, while organization and product must still resolve to the same identity.
- `event_signature.action` must use the canonical vocabulary enforced by `scripts/news-quality.mjs`; tense or synonym variants are rejected instead of becoming a duplicate bypass.
- One `event_id` may appear in only one primary section of an edition.
- If a material change makes an old event newsworthy again, reuse its `event_id`, add a concrete `material_update`, and add an `update_kind`: `status-change`, `availability-change`, `version-change`, `pricing-change`, `scope-change`, `independent-confirmation`, `correction`, `incident-resolution`, or `other-material-change`.
- A returning event must prove a structural delta with at least one genuinely new canonical source URL, or with both a later item `published_at` and a later source `published_at` on an already indexed URL. HTTP/HTTPS variants and known tracking parameters count as the same URL. Unknown query parameters are preserved by default because `?id=123` and `?id=456` may identify different resources; host-specific identifiers for YouTube, Hacker News, OpenReview, and SSRN remain authoritative. An unchanged-source rewrite is rejected even when its explanation is long enough.
- `independent-confirmation` requires a chronologically later `reporting` or `research` source from a publisher host not previously used for the event. Typed update kinds enforce matching semantic signature changes; for example, a pricing update needs a changed pricing artifact and an incident resolution must use the resolution action.
- Normalized signature matching treats common organization/product suffixes as aliases. A weak artifact-token match also needs topical title overlap, so date proximity or one generic shared token alone does not merge unrelated releases.
- Reusing the same canonical URL for a different event is rejected.
- The scheduled cutoff is 07:00 Asia/Ho_Chi_Minh. The exact half-open 24-hour or 72-hour window ends at `effective_cutoff = min(scheduled_cutoff, meta.generated_at or actual run time)`, so a manual pre-07 run cannot accept a future publication. Date-only values use a calendar fallback, but the edition date itself is rejected without a time because pre-cutoff publication cannot be proven.
- Hard depth gates block missing copy, evidence, practical trend structure, and obvious fragments. Unusually short/long briefs, trends, and releases are warnings; a 199-word complete story does not fail merely for missing an arbitrary threshold.
- Reusing the same lead `editorial_theme` across the previous three editions produces an editorial warning. Reusing the same theme plus angle within three editions produces a stronger warning. These never fail the build by themselves.
- Each source must link directly to supporting evidence and include its own `published_at`.
- Each source also requires a readable `label` and a `type` of `official`, `research`, or `reporting`.

The generated schema-v3 `data/news-index.json` stores the initial and current structured signatures, each occurrence's signature, update classification and duplicate-override rationale, normalized title, canonical sources, and occurrence history as cross-edition memory. It must never be edited manually.

## Visual keys

Visual hints never contain SVG or HTML. `scripts/visuals.mjs` maps a short key to a reusable, theme-aware SVG and can also render an editorial image or screenshot.

Supported visual kinds:

- `editorial`: existing abstract editorial SVG.
- `chart`: quantitative comparison; may provide a simplified mobile treatment.
- `diagram`: architecture or process explanation.
- `stat`: dominant quantitative finding, normally paired with `trend.stat`.
- `image`: meaningful editorial photography.
- `screenshot`: real product or interface capture.

For `image` and `screenshot`, `src` and meaningful `alt` text are required; provide `caption` and optional `credit`. For the code-native kinds, provide `key` and `caption`.

Known keys:

- cost-down-system-up
- sol-pricing-channel-comparison
- model-harness-environment-verification
- model-harness-verification
- browser-computer-use
- chat-tools-workflow-workspace

An unknown key renders a neutral editorial fallback and does not fail the build. Every visual uses the caption supplied by JSON.

## Adding an edition

1. Read `AGENTS.md` and `data/news-index.json`.
2. Research from an empty candidate list; do not copy an older edition.
3. Add `content/YYYY-MM-DD.json` and set `edition_date` to match the filename.
4. Keep all prose as plain JSON strings.
5. Run `npm run test:news`, `npm run news:index`, `npm run news:check`, and `npm run build`.
6. Review dist/index.html, dist/YYYY-MM-DD/index.html, and dist/archive/index.html.

`npm run news:index` is the only normal command that rewrites the generated ledger. The build checks that it is current and fails before writing dist when a required field, enum, factual quality rule, or ledger check is invalid. Daily publication otherwise requires JSON edits only.
