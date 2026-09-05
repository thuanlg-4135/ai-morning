import { defineConfig } from "@playwright/test";
import { basePath } from "./lib/site.mjs";

export default defineConfig({
  testDir: "./tests/browser",
  outputDir: ".verification/playwright",
  workers: 2,
  use: {
    baseURL: `http://localhost:8080${basePath}/`,
    browserName: "chromium",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run preview",
    url: `http://localhost:8080${basePath}/`,
    reuseExistingServer: !process.env.CI,
  },
});
