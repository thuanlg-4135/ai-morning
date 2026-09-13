# Website readiness audit · 2026-09-13

This is a static publication, not a checkout or lead-generation site. A marketing checklist is not a security audit.

| Checklist item | AI Morning decision |
| --- | --- |
| Custom 404 | Existing custom page; explicitly noindex, with return-to-reading link. |
| Page titles and descriptions | Present on editions and learning pages; archive now has its own description. About and 404 have dedicated metadata. |
| Above-the-fold CTA | Existing “Bắt đầu đọc” is the appropriate primary action. |
| Favicon set | SVG plus generated 32px PNG and 180px Apple touch icon. |
| robots.txt | Exported, but the project-path copy does not control crawlers. See deployment limitation below. |
| Sitemap | Canonical dated VI/EN editions, archives, learning pages and About; regenerated from published content. No speculative dates or unreviewed translations. |
| Open Graph image | Generated 1200×630 JPEG per edition from existing local editorial art; mark fallback for editions without raster art and general pages. Twitter large-image metadata too. No new factual illustration. |
| Alt text | Editorial image contract already requires meaningful alt. Decorative art should use empty alt or be hidden from accessibility APIs. |
| Mobile breakpoints | Existing responsive layout and browser coverage. |
| Sticky mobile CTA | Not added: reading tools already serve the task; extra overlays reduce reading space. |
| Loading states | Static HTML supports reading before hydration; no artificial loading screen. |
| Form errors / thank-you page | No submission form in this application. Revisit if one is introduced. |
| Privacy information | About page explains actual localStorage, host/external requests, deletion, and no app analytics. |
| Terms | No invented legal boilerplate. Review when accounts, subscriptions or transactions are introduced. |
| Cookie banner | No tracking integration added. Assess consent requirements before introducing tracking; do not add a nonfunctional banner. |
| Analytics | Optional product decision, not a launch/security prerequisite. No tracking added. |
| Contact address | Link to the existing repository's public Issues, explicitly identified as public. No private email or street address published. |
| Compressed images | Existing HD PNG → WebP build retained; new social JPEGs do not replace the editorial sources. |

## GitHub Pages origin limitation

The site is served under `https://thuanlg-4135.github.io/ai-morning/`. Crawlers look for `https://thuanlg-4135.github.io/robots.txt`, not `/ai-morning/robots.txt`. This repository cannot change that origin-root file. The exported robots file is useful if the site moves to domain-root hosting; do not claim it protects or governs this project now.

The sitemap is available at `https://thuanlg-4135.github.io/ai-morning/sitemap.xml` and can be submitted through the site's verified Search Console property. Origin-root robots configuration and Search Console submission were not part of this repository update.

## Security scope

Metadata, a cookie banner, analytics and terms do not prove a site secure. This patch does not audit dependencies, workflow permissions or all HTML insertion paths. Check those separately when performing a security review, and review authentication, authorization and server-side validation if a backend is introduced.

## Sources

- https://developers.google.com/search/docs/crawling-indexing/robots/intro
- https://developers.google.com/search/docs/crawling-indexing/robots/create-robots-txt
- https://www.w3.org/WAI/tutorials/images/decorative/
- Installed Next.js metadata and static export documentation.
