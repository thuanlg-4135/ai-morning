import { absoluteUrl } from "../lib/metadata.mjs";

export const dynamic = "force-static";
// Effective only when served at the origin root. See docs/site-readiness.md.
export default function robots() {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
