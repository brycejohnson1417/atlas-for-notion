import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const dataDir = process.env.ATLAS_DATA_DIR ?? join(process.cwd(), ".atlas");

export function atlasPath(name: string) {
  return join(dataDir, name);
}

export async function readJson<T>(name: string): Promise<T | null> {
  try {
    const content = await readFile(atlasPath(name), "utf8");
    return JSON.parse(content) as T;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

export async function writeJson(name: string, value: unknown) {
  const path = atlasPath(name);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
