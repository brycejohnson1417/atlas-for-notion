import { NextResponse } from "next/server";
import type { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getStoredConfig } from "@/lib/config-store";
import { createNotionClient } from "@/lib/notion/client";

interface RouteContext {
  params: Promise<{ databaseId: string }>;
}

export async function GET(_request: Request, context: RouteContext) {
  const stored = await getStoredConfig();
  if (!stored?.token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { databaseId } = await context.params;
  const client = createNotionClient(stored.token);
  const database = await client.databases.retrieve({ database_id: databaseId });
  if (database.object !== "database") {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const properties = Object.entries((database as DatabaseObjectResponse).properties).map(([name, property]) => ({
    id: property.id,
    name,
    type: property.type,
  }));

  return NextResponse.json({ properties });
}
