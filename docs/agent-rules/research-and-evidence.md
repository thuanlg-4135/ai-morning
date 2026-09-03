# Research and evidence rules

Use these rules whenever a task researches, drafts, verifies, or materially changes an AI Morning news item.

## Before researching an edition

1. Read `docs/content-schema.md`, `docs/news-pipeline-plan.md`, `config/news-sources.json`, and `data/news-index.json`.
2. Define the scheduled cutoff as 07:00 Asia/Ho_Chi_Minh on `edition_date`, then use `effective_cutoff = min(scheduled_cutoff, meta.generated_at or the actual run time)`.
3. The primary scan covers the preceding 24 hours. Context may look back at most 72 hours.
4. Search the event index before drafting. Treat matching product/version, organization, action, artifact, and canonical source URL as the same event even when headlines differ.
5. Never copy the previous edition as a content starting point. Start from an empty candidate list.

Published edition files are durable input to the generated event ledger. Do not prune or rename old editions as routine cleanup. If archival is required, preserve their event signatures in an explicit migration.

## Research broadly

Use live web research for every edition. Do not rely on model memory, search-result snippets, another newsletter, or a single vendor feed.

Search at least these source groups:

- Primary model/platform sources: OpenAI, Anthropic, Google DeepMind, Google AI Developers, Meta AI, Mistral, Microsoft AI, AWS Machine Learning, Azure AI, NVIDIA Developer, Hugging Face, Qwen, DeepSeek, and other major labs when their primary pages are accessible.
- Developer tooling: GitHub Changelog, VS Code, Vercel Changelog, Cloudflare, JetBrains, Cursor, major agent tools, package registries, runtime release notes, and official GitHub release pages.
- Operations and security: vendor status histories, GitHub advisories, CISA/NIST, incident reports, and security release notes.
- Research and standards: original papers, arXiv metadata, lab publications, NIST, and relevant regulator or standards pages.
- Independent reporting: Reuters and other reputable reporting for corporate, policy, funding, security, or disputed claims. Use specialist outlets for discovery and context, then find the primary source.
- Discovery only: Hacker News, Reddit, Product Hunt, social posts, and aggregator newsletters. These may surface candidates but cannot be the sole evidence for a factual item.

Vary queries by organization, product, event type, date, and domain. Check official changelogs directly because general search often misses them. Record failed or quiet source groups in research notes instead of inventing a story.

## Verify every candidate

Open the source page and confirm all of the following:

- The URL is the canonical article or release page, not a search page or generic homepage.
- A visible publication or update date exists, including timestamp and time zone when available.
- The exact timestamp is strictly before the effective cutoff.
- Reject events at the cutoff, after the actual generation time, future-scheduled pages, and pre-accessible pages.
- The source explicitly supports the stated change, number, availability, and product/version name.
- The event falls inside the edition window or is honestly labelled `CONTEXT_72H`.
- Rumors, leaks, and unnamed-source reporting are labelled as reported or speculative, never confirmed.
- Consequential or disputed claims have two independent sources.
- Product announcements use an official primary source whenever one exists.

Do not cite a page solely because its title resembles the claim. Do not infer a release date from a crawl date. Do not turn an absence of release notes into a factual product story.

## Evidence boundaries

Facts, analysis, and recommendations must remain visibly distinct. Every recommendation must be supported by cited evidence. A vendor claim remains a vendor claim until independent evidence supports it. Fewer strong stories are preferable to recycled context on a quiet day.
