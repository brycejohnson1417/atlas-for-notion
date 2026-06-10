import type { Geocoder, GeocodeResult } from "@/lib/geocode/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
let lastNominatimAt = 0;

function rounded(value: number) {
  return Number(value.toFixed(6));
}

export class NominatimGeocoder implements Geocoder {
  async geocode(address: string): Promise<GeocodeResult> {
    const elapsed = Date.now() - lastNominatimAt;
    if (elapsed < 1000) {
      await sleep(1000 - elapsed);
    }
    lastNominatimAt = Date.now();

    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "jsonv2");
    url.searchParams.set("limit", "1");
    url.searchParams.set("q", address);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "atlas-for-notion/0.1 (+https://github.com/OWNER/atlas-for-notion)",
      },
    });

    if (!response.ok) {
      return { lat: 0, lng: 0, status: "failed", reason: `nominatim_${response.status}` };
    }

    const results = await response.json() as Array<{ lat?: string; lon?: string }>;
    const first = results[0];
    if (!first?.lat || !first.lon) {
      return { lat: 0, lng: 0, status: "failed", reason: "no_match" };
    }
    return { lat: rounded(Number(first.lat)), lng: rounded(Number(first.lon)), status: "ok" };
  }
}

export class CensusGeocoder implements Geocoder {
  async geocode(address: string): Promise<GeocodeResult> {
    const url = new URL("https://geocoding.geo.census.gov/geocoder/locations/onelineaddress");
    url.searchParams.set("format", "json");
    url.searchParams.set("benchmark", "Public_AR_Current");
    url.searchParams.set("address", address);

    const response = await fetch(url);
    if (!response.ok) {
      return { lat: 0, lng: 0, status: "failed", reason: `census_${response.status}` };
    }
    const json = await response.json() as {
      result?: { addressMatches?: Array<{ coordinates?: { x?: number; y?: number } }> };
    };
    const coordinates = json.result?.addressMatches?.[0]?.coordinates;
    if (typeof coordinates?.x !== "number" || typeof coordinates.y !== "number") {
      return { lat: 0, lng: 0, status: "failed", reason: "no_match" };
    }
    return { lat: rounded(coordinates.y), lng: rounded(coordinates.x), status: "ok" };
  }
}

export function getGeocoder(name: "nominatim" | "census" | "mapbox" | "google"): Geocoder {
  if (name === "census") return new CensusGeocoder();
  return new NominatimGeocoder();
}
