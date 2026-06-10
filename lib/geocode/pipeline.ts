import type { Account, AtlasConfig } from "@/lib/types";
import { getCachedGeocode, setCachedGeocode } from "@/lib/geocode/cache";
import { getGeocoder } from "@/lib/geocode/providers";

export async function geocodeMissingAccounts(accounts: Account[], config: AtlasConfig): Promise<Account[]> {
  const geocoder = getGeocoder(config.geocoder);
  const next: Account[] = [];

  for (const account of accounts) {
    if (account.lat != null && account.lng != null) {
      next.push({ ...account, geocodeStatus: "ok" });
      continue;
    }
    if (!account.address) {
      next.push({ ...account, geocodeStatus: "failed" });
      continue;
    }

    const cached = await getCachedGeocode(account.address);
    const result = cached ?? await geocoder.geocode(account.address);
    if (!cached) {
      await setCachedGeocode(account.address, result);
    }

    next.push(result.status === "ok"
      ? { ...account, lat: result.lat, lng: result.lng, geocodeStatus: "ok" }
      : { ...account, geocodeStatus: "failed" });
  }

  return next;
}
