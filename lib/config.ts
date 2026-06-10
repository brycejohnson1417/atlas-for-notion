import { z } from "zod";
import type { AtlasConfig } from "@/lib/types";

export const atlasConfigSchema = z.object({
  accountsDatabaseId: z.string().min(1),
  mapping: z.object({
    name: z.string().min(1),
    address: z.string().optional(),
    latitude: z.string().optional(),
    longitude: z.string().optional(),
    status: z.string().optional(),
    segment: z.string().optional(),
    badges: z.string().optional(),
    owner: z.string().optional(),
    phone: z.string().optional(),
    email: z.string().optional(),
    website: z.string().optional(),
    lastTouch: z.string().optional(),
    notes: z.string().optional(),
  }),
  geocoder: z.enum(["nominatim", "census", "mapbox", "google"]).default("nominatim"),
  writeBackCoordinates: z.boolean().default(false),
}).transform((value) => value satisfies AtlasConfig);

export function isDemoMode() {
  return process.env.DEMO_MODE === "true";
}

export function getEnvNotionToken() {
  return isDemoMode() ? process.env.DEMO_NOTION_TOKEN ?? process.env.NOTION_TOKEN : process.env.NOTION_TOKEN;
}

export function getEnvConfig(): AtlasConfig | null {
  const databaseId = process.env.ACCOUNTS_DATABASE_ID;
  if (!databaseId) {
    return null;
  }

  const parsed = atlasConfigSchema.safeParse({
    accountsDatabaseId: databaseId,
    mapping: {
      name: process.env.MAP_NAME ?? "title",
      address: process.env.MAP_ADDRESS,
      latitude: process.env.MAP_LATITUDE,
      longitude: process.env.MAP_LONGITUDE,
      status: process.env.MAP_STATUS,
      segment: process.env.MAP_SEGMENT,
      badges: process.env.MAP_BADGES,
      owner: process.env.MAP_OWNER,
      phone: process.env.MAP_PHONE,
      email: process.env.MAP_EMAIL,
      website: process.env.MAP_WEBSITE,
      lastTouch: process.env.MAP_LAST_TOUCH,
      notes: process.env.MAP_NOTES,
    },
    geocoder: process.env.GEOCODER ?? "nominatim",
    writeBackCoordinates: process.env.WRITE_BACK_COORDINATES === "true",
  });

  return parsed.success ? parsed.data : null;
}

export function getEmbedShareKey() {
  return process.env.EMBED_SHARE_KEY ?? "dev-demo-key";
}

export function getTileStyle(theme: "dark" | "light") {
  const override = process.env.MAP_TILE_URL;
  if (override) {
    return override;
  }
  return theme === "dark"
    ? "https://tiles.openfreemap.org/styles/dark"
    : "https://tiles.openfreemap.org/styles/liberty";
}
