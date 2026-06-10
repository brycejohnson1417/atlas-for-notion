import { execFile } from "node:child_process";
import { promises as dns } from "node:dns";
import { promisify } from "node:util";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const execFileAsync = promisify(execFile);
const reportDir = join(process.cwd(), "reports");

async function npmPackageAvailable(name: string) {
  try {
    await execFileAsync("npm", ["view", name, "version"], { timeout: 15_000 });
    return { target: name, available: false, evidence: "npm package exists" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { target: name, available: /E404|404/.test(message), evidence: message.split("\n")[0] ?? message };
  }
}

async function githubRepoAvailable(owner: string, repo: string) {
  const url = `https://github.com/${owner}/${repo}.git`;
  try {
    await execFileAsync("git", ["ls-remote", url], { timeout: 15_000 });
    return { target: `github:${owner}/${repo}`, available: false, evidence: "git ls-remote succeeded" };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { target: `github:${owner}/${repo}`, available: /not found|Repository not found|exit code 128/i.test(message), evidence: message.split("\n")[0] ?? message };
  }
}

async function domainAvailable(domain: string) {
  try {
    const addresses = await dns.resolveAny(domain);
    return { target: domain, available: false, evidence: `DNS records found: ${addresses.length}` };
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    return { target: domain, available: code === "ENOTFOUND" || code === "ENODATA", evidence: code || String(error) };
  }
}

const checks = [
  await npmPackageAvailable("atlas-for-notion"),
  await githubRepoAvailable("atlas-for-notion", "atlas-for-notion"),
  await domainAvailable("atlas-for-notion.com"),
  await domainAvailable("atlasfornotion.com"),
];

await mkdir(reportDir, { recursive: true });
const text = [
  `Availability check generated: ${new Date().toISOString()}`,
  ...checks.map((check) => `${check.target}: ${check.available ? "available" : "not available/unknown"} (${check.evidence})`),
  "",
].join("\n");
await writeFile(join(reportDir, "availability.txt"), text);
process.stdout.write(text);
