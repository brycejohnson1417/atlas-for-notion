import { Client } from "@notionhq/client";
import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createNotionClient(token: string) {
  return new Client({
    auth: token,
    notionVersion: "2022-06-28",
  });
}

export async function withRetry<T>(operation: () => Promise<T>, attempts = 3): Promise<T> {
  let lastError: unknown;
  for (let index = 0; index < attempts; index += 1) {
    try {
      if (index > 0) {
        await sleep(500 * 2 ** index);
      }
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function queryAll(client: Client, databaseId: string): Promise<PageObjectResponse[]> {
  const pages: PageObjectResponse[] = [];
  let startCursor: string | undefined;

  do {
    const response = await withRetry(() =>
      client.databases.query({
        database_id: databaseId,
        start_cursor: startCursor,
        page_size: 100,
      }),
    );
    pages.push(...response.results.filter((page): page is PageObjectResponse => "properties" in page));
    startCursor = response.has_more ? response.next_cursor ?? undefined : undefined;
    await sleep(350);
  } while (startCursor);

  return pages;
}
