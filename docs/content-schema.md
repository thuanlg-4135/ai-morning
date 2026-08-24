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
- meta: scan hours, context window, reading time, and source policy.
- hero_visual: a visual hint consumed by the visual renderer.
- edition_mode: BIG, NORMAL, or QUIET. If omitted, the renderer infers a mode.
- edition_number: explicit issue number; otherwise derived chronologically.
- one_number: value, label, and optional context for the desktop newspaper rail.
- watching: short topic labels for the desktop newspaper rail.
- wildcard: optional closing item with title and text.
- content_contract: documentation metadata; ignored by the renderer.
- Unknown optional fields are ignored safely.

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

id, importance, pullquote, stat, action, and visual are optional. `event_id`, `event_signature`, `published_at`, and a non-empty `sources` array are required by the news-quality validator. `importance` accepts `LEAD`, `SECONDARY`, or `BRIEF`. paragraphs is plain text; do not put HTML or presentation classes in it.

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
- A returning event must prove a structural delta with at least one genuinely new canonical source URL, or with both a later item `published_at` and a later source `published_at` on an already indexed URL. HTTP/HTTPS variants, tracking parameters, and unknown query variants count as the same URL; host-specific resource identifiers such as YouTube's `v` remain distinct. An unchanged-source rewrite is rejected even when its explanation is long enough.
- `independent-confirmation` requires a chronologically later `reporting` or `research` source from a publisher host not previously used for the event. Typed update kinds enforce matching semantic signature changes; for example, a pricing update needs a changed pricing artifact and an incident resolution must use the resolution action.
- Normalized signature matching treats common organization/product suffixes as aliases. A weak artifact-token match also needs topical title overlap, so date proximity or one generic shared token alone does not merge unrelated releases.
- Reusing the same canonical URL for a different event is rejected.
- Full timestamps use exact half-open 24-hour or 72-hour windows ending at 07:00 Asia/Ho_Chi_Minh. Date-only values use a calendar fallback, but the edition date itself is rejected without a time because pre-cutoff publication cannot be proven.
- Briefs need at least 40 words, trends 200 words, releases 75 words, and radar items 12 words.
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

For `image` and `screenshot`, provide `src`, `alt`, `caption`, and optional `credit`. For the code-native kinds, provide `key` and `caption`.

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
5. Run `npm run news:index` followed by `npm run build`.
6. Review dist/index.html, dist/YYYY-MM-DD/index.html, and dist/archive/index.html.

The build fails before writing dist when a required field or enum is invalid.
