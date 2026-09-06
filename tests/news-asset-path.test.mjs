import assert from "node:assert/strict";
import test from "node:test";
import { asset, optimizedAssetPath } from "../lib/site.mjs";

test("HD editorial PNGs use generated WebP delivery paths", () => {
  assert.equal(
    optimizedAssetPath("editorial/2026-09-06/hero-hd.png"),
    "editorial/2026-09-06/hero-hd.webp",
  );
  assert.equal(
    asset("editorial/2026-09-06/bun-hd.png"),
    "/ai-morning/assets/editorial/2026-09-06/bun-hd.webp",
  );
});

test("non-HD and external assets keep their original paths", () => {
  assert.equal(
    optimizedAssetPath("editorial/2026-09-05/example.png"),
    "editorial/2026-09-05/example.png",
  );
  assert.equal(asset("https://example.com/image.png"), "https://example.com/image.png");
});
