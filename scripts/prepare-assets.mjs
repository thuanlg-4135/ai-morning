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
