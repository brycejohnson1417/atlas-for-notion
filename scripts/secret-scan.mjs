import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const buildDir = join(process.cwd(), ".next");
if (!existsSync(buildDir)) {
  process.exit(0);
}

const suspect = /(ntn_|secret_)[A-Za-z0-9_-]{20,}/;
const files = [join(buildDir, "BUILD_ID")];
for (const file of files) {
  if (existsSync(file) && suspect.test(readFileSync(file, "utf8"))) {
    console.error(`Potential Notion token leaked in ${file}`);
    process.exit(1);
  }
}
