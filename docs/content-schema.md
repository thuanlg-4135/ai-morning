# AI Morning content schema

Daily editions live in content/YYYY-MM-DD.json. JSON files contain editorial content only; the renderer in scripts/build.mjs owns HTML, classes, layout, navigation, and accessibility markup.

The canonical schema version is 1, based on content/2026-08-23.json.

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
      "freshness": "NEW_TODAY",
      "text": "Một tín hiệu ngắn, đủ đọc trong vài giây."
    }

### Trend

    {
      "id": "stable-slug",
      "freshness": "NEW_TODAY",
      "strength": "ACCELERATING",
      "title": "Tiêu đề phân tích",
      "paragraphs": [
        "Đoạn văn thứ nhất.",
        "Đoạn văn thứ hai."
      ],
      "pullquote": "Pull quote tùy chọn.",
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
          "type": "official"
        }
      ]
    }

id, pullquote, action, visual, and sources are optional. paragraphs is plain text; do not put HTML or presentation classes in it.

### Release

    {
      "product": "Product name",
      "feature": "Feature name",
      "freshness": "CONTEXT_72H",
      "status": "GA",
      "summary": "Release summary.",
      "who_gets_it": "Optional availability note.",
      "verdict": "WATCH",
      "verdict_note": "Why the reader should watch.",
      "sources": []
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
      "status": "WATCH",
      "text": "Tín hiệu cần theo dõi."
    }

## Visual keys

Visual hints never contain SVG or HTML. scripts/visuals.mjs maps a short key to a reusable, theme-aware SVG.

Known keys:

- cost-down-system-up
- sol-pricing-channel-comparison
- model-harness-environment-verification
- model-harness-verification
- browser-computer-use
- chat-tools-workflow-workspace

An unknown key renders a neutral editorial fallback and does not fail the build. Every visual uses the caption supplied by JSON.

## Adding an edition

1. Copy the most recent JSON file to content/YYYY-MM-DD.json.
2. Replace its editorial content and set edition_date to match the filename.
3. Keep all prose as plain JSON strings.
4. Run npm run build.
5. Review dist/index.html, dist/YYYY-MM-DD/index.html, and dist/archive/index.html.

The build fails before writing dist when a required field or enum is invalid.
