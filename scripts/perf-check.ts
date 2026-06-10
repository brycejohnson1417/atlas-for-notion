import { spawn } from "node:child_process";
import { execFile } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import { chromium } from "@playwright/test";
import lighthouse from "lighthouse";

const port = 3300;
const url = `http://127.0.0.1:${port}`;
const reportDir = join(process.cwd(), "reports");
const execFileAsync = promisify(execFile);

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Server is still starting.
    }
    await wait(500);
  }
  throw new Error("Timed out waiting for Atlas production server.");
}

await execFileAsync("pnpm", ["exec", "next", "build"], {
  cwd: process.cwd(),
  env: { ...process.env, DEMO_MODE: "true", EMBED_SHARE_KEY: "dev-demo-key" },
  timeout: 120_000,
});

const server = spawn("pnpm", ["exec", "next", "start", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: process.cwd(),
  env: { ...process.env, DEMO_MODE: "true", EMBED_SHARE_KEY: "dev-demo-key" },
  stdio: "ignore",
});

try {
  await waitForServer();
  const browser = await chromium.launch({ args: ["--remote-debugging-port=9222"] });
  const result = await lighthouse(url, {
    port: 9222,
    output: "json",
    onlyCategories: ["performance"],
    formFactor: "mobile",
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },
    throttlingMethod: "simulate",
  });
  await browser.close();

  if (!result?.lhr) {
    throw new Error("Lighthouse did not return a report.");
  }

  const score = Math.round((result.lhr.categories.performance.score ?? 0) * 100);
  await mkdir(reportDir, { recursive: true });
  await writeFile(join(reportDir, "lighthouse-mobile.json"), JSON.stringify(result.lhr, null, 2));
  const summary = `Lighthouse mobile performance: ${score}\nURL: ${url}\n`;
  await writeFile(join(reportDir, "lighthouse-summary.txt"), summary);
  process.stdout.write(summary);

  if (score < 85) {
    process.exitCode = 1;
  }
} finally {
  server.kill("SIGTERM");
}
