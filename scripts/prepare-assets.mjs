import { cp, mkdir } from "node:fs/promises";

await mkdir("public/assets", { recursive: true });
for (const name of ["fonts", "editorial", "mark.svg"]) {
  await cp(`assets/${name}`, `public/assets/${name}`, { recursive: true });
}
