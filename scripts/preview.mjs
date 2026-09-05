import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { basePath } from "../lib/site.mjs";

const root = path.resolve("dist");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".txt": "text/plain",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".webp": "image/webp",
  ".png": "image/png",
  ".ico": "image/x-icon",
};
createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(
      new URL(request.url, "http://localhost").pathname,
    );
    if (basePath && pathname === "/") {
      response.writeHead(302, { Location: `${basePath}/` });
      response.end();
      return;
    }
    if (
      basePath &&
      pathname !== basePath &&
      !pathname.startsWith(`${basePath}/`)
    )
      throw new Error("Outside base path");
    let file = path.resolve(root, `.${pathname.slice(basePath.length) || "/"}`);
    if (file !== root && !file.startsWith(`${root}${path.sep}`))
      throw new Error("Outside export");
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    const data = await readFile(file);
    response.writeHead(200, {
      "Content-Type": mime[path.extname(file)] || "application/octet-stream",
    });
    response.end(data);
  } catch {
    response.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    response.end(
      await readFile(path.join(root, "404.html")).catch(() => "Not found"),
    );
  }
}).listen(8080, "0.0.0.0", () =>
  console.log(`Static export: http://localhost:8080${basePath}/`),
);
