import { cp, mkdir, readdir, rm, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const publicAssets = "public/assets";
const editorialSource = "assets/editorial";
const editorialOutput = `${publicAssets}/editorial`;

await rm(publicAssets, { recursive: true, force: true });
await mkdir(publicAssets, { recursive: true });
await cp("assets/fonts", `${publicAssets}/fonts`, { recursive: true });
await cp("assets/mark.svg", `${publicAssets}/mark.svg`);

let originalHdBytes = 0;
let optimizedHdBytes = 0;

async function copyEditorialDirectory(sourceDir, outputDir) {
  await mkdir(outputDir, { recursive: true });
  const entries = await readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const outputPath = path.join(outputDir, entry.name);

    if (entry.isDirectory()) {
      await copyEditorialDirectory(sourcePath, outputPath);
      continue;
    }

    if (/-hd\.png$/i.test(entry.name)) {
      const targetPath = outputPath.replace(/\.png$/i, ".webp");
      const { size } = await stat(sourcePath);
      originalHdBytes += size;

      const info = await sharp(sourcePath)
        .resize({ width: 1536, withoutEnlargement: true })
        .webp({ quality: 84, effort: 5, smartSubsample: true })
        .toFile(targetPath);
      optimizedHdBytes += info.size;
      continue;
    }

    await cp(sourcePath, outputPath);
  }
}

await copyEditorialDirectory(editorialSource, editorialOutput);

if (originalHdBytes > 0) {
  const savedPercent = Math.round(
    (1 - optimizedHdBytes / originalHdBytes) * 100,
  );
  console.log(
    `Optimized HD editorial images: ${(originalHdBytes / 1024 / 1024).toFixed(2)} MB -> ${(optimizedHdBytes / 1024 / 1024).toFixed(2)} MB (${savedPercent}% smaller)`,
  );
}

// Reuse the existing brand mark and editorial art for crawler-friendly raster previews.
await sharp("assets/mark.svg")
  .resize(32, 32)
  .png()
  .toFile(`${publicAssets}/favicon-32.png`);
await sharp("assets/mark.svg")
  .resize(180, 180)
  .png()
  .toFile(`${publicAssets}/apple-touch-icon.png`);
const socialOutput = `${publicAssets}/social`;
await mkdir(socialOutput, { recursive: true });
const background = "#f5f1e8";
const mark = await sharp("assets/mark.svg").resize(300, 300).png().toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background } })
  .composite([{ input: mark, gravity: "centre" }])
  .jpeg({ quality: 85 })
  .toFile(`${socialOutput}/default.jpg`);
const { readFile } = await import("node:fs/promises");
for (const name of (await readdir("content")).filter((name) =>
  /^\d{4}-\d{2}-\d{2}\.json$/.test(name),
)) {
  const edition = JSON.parse(await readFile(`content/${name}`, "utf8"));
  const visual = [
    edition.hero_visual,
    ...edition.trends.map((item) => item.visual),
    ...edition.brief.map((item) => item.visual),
    ...edition.releases.map((item) => item.visual),
  ].find(
    (v) =>
      v?.src?.startsWith("editorial/") &&
      !v.src.includes("..") &&
      /\.(png|jpe?g|webp)$/i.test(v.src),
  );
  const output = `${socialOutput}/${edition.edition_date}.jpg`;
  if (visual) {
    await sharp(path.join("assets", visual.src))
      .resize(1200, 630, { fit: "contain", background })
      .flatten({ background })
      .jpeg({ quality: 85 })
      .toFile(output);
  } else {
    await cp(`${socialOutput}/default.jpg`, output);
  }
}
