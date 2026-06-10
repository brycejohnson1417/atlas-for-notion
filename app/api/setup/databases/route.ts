import { NextResponse } from "next/server";
import type { DatabaseObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getStoredConfig } from "@/lib/config-store";
import { createNotionClient } from "@/lib/notion/client";

function titleText(database: DatabaseObjectResponse) {
  return database.title.map((item) => item.plain_text).join("").trim() || "Untitled database";
}

function iconText(database: DatabaseObjectResponse) {
  if (!database.icon) return null;
  if (database.icon.type === "emoji") return database.icon.emoji;
  return null;
}

export async function GET() {
  const stored = await getStoredConfig();
  if (!stored?.token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const client = createNotionClient(stored.token);
  const response = await client.search({
    filter: { property: "object", value: "database" },
    page_size: 100,
  });
  const databases = response.results
    .filter((item): item is DatabaseObjectResponse => item.object === "database")
    .map((database) => ({
      id: database.id,
      title: titleText(database),
      icon: iconText(database),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));

  return NextResponse.json({ databases });
}
