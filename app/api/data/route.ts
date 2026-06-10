import { NextResponse } from "next/server";
import { getCachedData, setCachedData } from "@/lib/cache/data-cache";
import { getEnvConfig, getEnvNotionToken, isDemoMode } from "@/lib/config";
import { getStoredConfig } from "@/lib/config-store";
import { buildDemoResponse } from "@/lib/demo-data";
import { geocodeMissingAccounts } from "@/lib/geocode/pipeline";
import { createNotionClient, queryAll } from "@/lib/notion/client";
import { buildApiResponse, normalizeAccounts, statusColorFromPages } from "@/lib/notion/normalize";

export const dynamic = "force-dynamic";

export async function GET() {
  const demoMode = isDemoMode();
  const cached = getCachedData();
  if (cached) {
    return NextResponse.json(cached);
  }

  const stored = await getStoredConfig();
  const token = getEnvNotionToken() ?? stored?.token;
  const config = getEnvConfig() ?? stored?.config ?? null;

  if (demoMode && (!token || !config)) {
    const response = buildDemoResponse();
    setCachedData(response, 5 * 60_000);
    return NextResponse.json(response);
  }

  if (!token || !config) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  try {
    const client = createNotionClient(token);
    const pages = await queryAll(client, config.accountsDatabaseId);
    const accounts = await geocodeMissingAccounts(normalizeAccounts(pages, config.mapping), config);
    const response = buildApiResponse(accounts, config.mapping, demoMode);
    response.statuses = response.statuses.map((status) => ({
      ...status,
      color: statusColorFromPages(pages, config.mapping, status.name),
    }));
    setCachedData(response, demoMode ? 5 * 60_000 : 60_000);
    return NextResponse.json(response);
  } catch (error) {
    console.warn("notion_unreachable", error);
    return NextResponse.json({ error: "notion_unreachable" }, { status: 502 });
  }
}
