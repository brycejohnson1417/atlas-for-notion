import type { ApiDataResponse } from "@/lib/types";

let cached: { value: ApiDataResponse; expiresAt: number } | null = null;

export function getCachedData() {
  if (!cached || cached.expiresAt < Date.now()) {
    return null;
  }
  return cached.value;
}

export function setCachedData(value: ApiDataResponse, ttlMs: number) {
  cached = { value, expiresAt: Date.now() + ttlMs };
}

export function clearCachedData() {
  cached = null;
}
