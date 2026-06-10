import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { buildDemoAccounts } from "../lib/demo-data";
import type { NotionColor } from "../lib/types";
import seedData from "./data.json";

function argValue(name: string) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

const parent = argValue("--parent");
const token = process.env.NOTION_TOKEN ?? process.env.DEMO_NOTION_TOKEN;

if (!parent || !token) {
  console.error("Usage: NOTION_TOKEN=... pnpm seed --parent <page_id>");
  process.exit(1);
}

const parentPageId = parent;
const notion = new Client({ auth: token });
const accounts = buildDemoAccounts();
const databaseTitle = seedData.database.title;
const statusOptions = seedData.database.statusOptions.map((status) => ({
  name: status.name,
  color: status.color as NotionColor,
}));

async function findExistingDatabase() {
  let cursor: string | undefined;
  do {
    const response = await notion.blocks.children.list({
      block_id: parentPageId,
      start_cursor: cursor,
      page_size: 100,
    });
    const match = response.results.find((block) =>
      "type" in block &&
      block.type === "child_database" &&
      "child_database" in block &&
      block.child_database.title === databaseTitle,
    );
    if (match) return match.id;
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return null;
}

async function createDatabase() {
  return notion.databases.create({
    parent: { type: "page_id", page_id: parentPageId },
    title: [{ type: "text", text: { content: databaseTitle } }],
    properties: {
      Name: { title: {} },
      Address: { rich_text: {} },
      Latitude: { number: { format: "number" } },
      Longitude: { number: { format: "number" } },
      Status: {
        select: {
          options: statusOptions,
        },
      },
      Segment: { multi_select: {} },
      Amenities: { multi_select: {} },
      Website: { url: {} },
      "Last Visit": { date: {} },
      Notes: { rich_text: {} },
    },
  });
}

function pageName(page: PageObjectResponse) {
  const property = page.properties.Name;
  return property?.type === "title" ? property.title.map((part) => part.plain_text).join("") : "";
}

async function existingNames(databaseId: string) {
  const names = new Set<string>();
  let cursor: string | undefined;
  do {
    const response = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
      page_size: 100,
    });
    for (const page of response.results) {
      if (page.object === "page" && "properties" in page) names.add(pageName(page));
    }
    cursor = response.has_more ? response.next_cursor ?? undefined : undefined;
  } while (cursor);
  return names;
}

const existingDatabaseId = await findExistingDatabase();
const database = existingDatabaseId ? await notion.databases.retrieve({ database_id: existingDatabaseId }) : await createDatabase();
const databaseId = database.id;
const names = await existingNames(databaseId);
let created = 0;

for (const account of accounts.filter((account) => !names.has(account.name))) {
  await notion.pages.create({
    parent: { database_id: databaseId },
    properties: {
      Name: { title: [{ type: "text", text: { content: account.name } }] },
      Address: { rich_text: [{ type: "text", text: { content: account.address ?? "" } }] },
      Latitude: { number: account.lat },
      Longitude: { number: account.lng },
      Status: account.status ? { select: { name: account.status } } : { select: null },
      Segment: { multi_select: account.segment.map((name) => ({ name })) },
      Amenities: { multi_select: account.badges.map((name) => ({ name })) },
      Website: { url: account.website },
      "Last Visit": account.lastTouch ? { date: { start: account.lastTouch } } : { date: null },
      Notes: { rich_text: [{ type: "text", text: { content: account.notesPreview ?? "" } }] },
    },
  });
  created += 1;
}

console.log(`Seeded ${created} new accounts (${accounts.length} total expected) into ${databaseId}`);
