# Frontend architecture

AI Morning uses Next.js App Router and React Server Components, with a static export for GitHub Pages. The presentation was rebuilt around a newspaper design with a Codex-inspired neutral and blue palette. Editorial JSON, the source ledger, and their validators remain the content authority.

## Ownership

| Location                            | Responsibility                                                               |
| ----------------------------------- | ---------------------------------------------------------------------------- |
| `app/`                              | Route entry points, metadata, language layouts, sitemap and global reset     |
| `components/document.jsx`           | HTML document, local fonts and restoration of reading preferences            |
| `components/page-route.jsx`         | Resolve localized home, archive, dated edition and individual story routes   |
| `components/layout/`                | Shared masthead, navigation and footer                                       |
| `components/news/front-page.jsx`    | Homepage discovery and ordering of sections                                  |
| `components/news/edition-page.jsx`  | Complete dated edition, memo and original fragment anchors                   |
| `components/news/article-page.jsx`  | Individual story with related reading                                        |
| `components/news/story-preview.jsx` | Headline, excerpt, metadata and reusable story shelves                       |
| `components/news/story-body.jsx`    | Complete article prose, action/verdict and original sources                  |
| `components/news/visual.jsx`        | Local images and existing escaped SVG renderer                               |
| `components/archive/`               | Archive page and client search/filter/saved-story controls                   |
| `components/learning/`              | Evergreen collection and full practical guides                               |
| `components/reading/`               | Small client components for preferences, bookmarks, copy-link and checklists |
| `lib/stories.mjs`                   | Pure presentation adapters, story URLs, labels and discovery deduplication   |
| `lib/saved-stories.mjs`             | Versioned browser storage contract for saved links                           |
| `styles/tokens.css`                 | Codex-inspired palette, page width and reading font-size tokens                  |
| `styles/reading.css`                | Shared interactive reading controls                                          |

News and layout components use colocated CSS Modules. Archive and learning styles each have a bounded class namespace. The global stylesheet contains only tokens, reset, accessibility primitives and the not-found view. Do not restore the former layered override stylesheet.

## Routes

- `/`: multi-story newspaper homepage. The lead block comes from the latest edition; older stories are explicitly labelled and show their edition dates.
- `/YYYY-MM-DD/`: complete original edition, including every item, source, memo and takeaway.
- `/YYYY-MM-DD/EVENT_ID/`: one article, with a stable event ID and publication occurrence in the URL.
- `/archive/`: edition search, individual-story search and saved stories.
- `/learn/` and `/learn/SLUG/`: evergreen practical articles.
- `/en/…`: the same news routes, only for reviewed translations.
- `/about/`: editorial and browser-storage information.

All paths are built without the deployment prefix when passed to Next.js `Link`. Asset URLs and plain browser URLs use `basePath` from `lib/site.mjs`. Every new static route must be generated and included in the sitemap with matching canonical metadata.

## Data boundaries

`getEditions()` validates immutable edition input. `storiesForEdition()` adapts it to a view model without editing or inventing copy. `collectStories()` takes the newest occurrence of each `event_id` for discovery. Homepage shelves do not create a new daily edition or relabel archived news as fresh.

A quiet edition remains short. Do not add placeholder articles, synthetic source links or invented paragraphs to fill the design. Existing visuals are displayed in their original colors and retain their caption and credit on article pages. Missing visuals result in text-led articles.

All editorial content is server-rendered. Client JavaScript is limited to optional search, saved reading and preferences; headline links, article bodies, sources and edition navigation work without it. Reading preferences retain their existing localStorage keys, and saved dated fragment links remain valid.

## Common changes

- Change the masthead or navigation: `components/layout/site-header.jsx` and `layout.module.css`.
- Change homepage grouping: `front-page.jsx`; change labels/adaptation in `lib/stories.mjs`.
- Change article typography: `.prose` in `news.module.css`; change font-size defaults in `styles/tokens.css`.
- Change content: the appropriate `content/` JSON and the editorial workflow, not UI components.
- Add a content field: follow the schema route in `docs/agent-rules/index.md` first.

## Validation

Run `npm run build`, `npm run test:browser`, and `npm run format:check`. The build checks edition integrity, static assets, local links, fragments and canonical URLs. Browser tests cover published editions and story routes across phone, tablet and desktop, light/dark palette contrast, discovery deduplication, keyboard/no-JavaScript reading, search, bookmarks, copy-link and preferences.

The previous presentation tests asserted the intentionally removed colored cards, decorative hero and quick-edition drawer. Their replacement is `tests/browser/newspaper.spec.mjs`; functional and content checks remain in `site.spec.mjs`, `learning.spec.mjs`, and `tests/export.test.mjs`.

Review screenshots in `.verification/redesign/` and `.verification/pages/` before handoff. These are generated artifacts, not editorial assets.
