import { randomBytes } from "node:crypto";
import { z } from "zod";
import { atlasConfigSchema } from "@/lib/config";
import { readJson, writeJson } from "@/lib/cache/fs-store";
import type { AtlasConfig } from "@/lib/types";

const storedConfigSchema = z.object({
  token: z.string().min(1),
  embedShareKey: z.string().min(12),
  config: atlasConfigSchema.optional(),
});

export type StoredConfig = z.infer<typeof storedConfigSchema>;

export async function getStoredConfig(): Promise<StoredConfig | null> {
  const raw = await readJson<unknown>("config.json");
  if (!raw) return null;
  const parsed = storedConfigSchema.safeParse(raw);
  return parsed.success ? parsed.data : null;
}

export async function saveSetupToken(token: string) {
  const existing = await getStoredConfig();
  await writeJson("config.json", {
    token,
    embedShareKey: existing?.embedShareKey ?? randomBytes(24).toString("base64url"),
    ...(existing?.config ? { config: existing.config } : {}),
  });
}

export async function saveAtlasConfig(config: AtlasConfig) {
  const existing = await getStoredConfig();
  if (!existing?.token) {
    throw new Error("missing_token");
  }
  await writeJson("config.json", {
    token: existing.token,
    embedShareKey: existing.embedShareKey,
    config,
  });
}
