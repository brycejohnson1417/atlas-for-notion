import { createHash } from "node:crypto";
import { readJson, writeJson } from "@/lib/cache/fs-store";
import type { GeocodeResult } from "@/lib/geocode/types";

type GeocodeCache = Record<string, GeocodeResult>;

function keyFor(address: string) {
  return createHash("sha256").update(address.trim().toLowerCase()).digest("hex");
}

export async function getCachedGeocode(address: string) {
  const cache = await readJson<GeocodeCache>("geocode-cache.json");
  return cache?.[keyFor(address)] ?? null;
}

export async function setCachedGeocode(address: string, result: GeocodeResult) {
  const cache = (await readJson<GeocodeCache>("geocode-cache.json")) ?? {};
  cache[keyFor(address)] = result;
  await writeJson("geocode-cache.json", cache);
}
