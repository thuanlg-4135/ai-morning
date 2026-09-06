# Practical relevance and creative learning

Read this file for every daily research pass and every learning article. The reader is a developer working in a company who also wants to learn 3D animation, video production and game development.

## Connect news to work

For each developed news story, explain a concrete team situation when relevant: implementing an agreed ticket, reviewing a PR, testing an API, debugging CI, maintaining a dependency, preparing a demo, or handing work to QA/frontend/backend. Prefer C#/.NET and TypeScript examples when they fit the source. Never invent the reader's employer, product domain, stack, access, budget, or internal policy.

Separate the verified feature from an explicitly hypothetical example. State who benefits, the smallest useful experiment, its expected deliverable, and the limitation. Use the existing trend paragraphs/action and release impact/verdict fields; a new schema field is unnecessary. It is valid to say a tool is not immediately relevant to ordinary product development. Do not force every infrastructure announcement into the reader's job.

## Broaden discovery

Scan official Blender, Godot, Unity, Unreal Engine and rendering/video sources alongside software-engineering sources. Cover animation, editing, asset workflows, small playable prototypes, testing, profiling, and delivery. AI is useful when it helps one of those tasks; articles do not need an AI product name to qualify.

Consider creative-learning candidates every research run and keep a balanced mix over multiple editions. Do not impose a daily quota or invent fresh releases to fill one. Fresh news must still satisfy the 24/72-hour windows and event ledger. Older tutorials belong in Học & làm and must never receive NEW_TODAY or a fabricated publication date.

## Learning collection

`content/learning/index.json` is an evergreen, Vietnamese collection published at `/learn/` and `/learn/[slug]/`. It is separate from dated news, and is intentionally excluded from the daily event ledger. The loader validates it during build.

Each article needs a stable unique slug, track (`work`, `animation`, `games`), specific title and summary, tools, preparation, work connection, practice-time estimate, titled steps, completion checks, a likely pitfall, an optional-use AI prompt, and direct official reference links. The collection's `updated_at` is the editorial revision date, not the publication date of external references.

Favor a small finished output over a tool catalogue: one meaningful test, a sample API contract, a short animation, an edited clip, or a playable game loop. Explain unfamiliar creative terms on first use. Prefer tools and source material available without buying an upgrade. Recheck actual costs and platform/export limits before promising free usage or a target platform.

Use original prose and clearly distinguish an authored exercise from source documentation. Link the exact official tutorial and disclose when steps have not been run end to end. Do not claim a screenshot, video, executable, benchmark, or hands-on test exists unless it was produced. Never turn a study article into an advertisement for paid add-ons.

## Maintenance and checks

Read `vietnamese-editorial-style.md` and `quality-workflow.md`. For route or rendering changes also read `../publishing.md` and local Next.js documentation. Run the normal build, which includes collection validation and exported links. Include new routes in browser coverage, and review phone, tablet and desktop output in both themes. Keep the initial implementation static; no accounts, course engine, database, or new agent framework is needed.
