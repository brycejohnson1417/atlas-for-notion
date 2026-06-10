import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import type { Account, ApiDataResponse, NotionColor, RoleMapping, StatusMeta } from "@/lib/types";
import { propertyList, propertyNumber, propertyOptionColor, propertyText } from "@/lib/notion/extract";

function prop(page: PageObjectResponse, idOrName: string | undefined) {
  if (!idOrName) return undefined;
  return Object.values(page.properties).find((property) => property.id === idOrName) ?? page.properties[idOrName];
}

function notesPreview(value: string | null) {
  if (!value) return null;
  return value.length > 140 ? `${value.slice(0, 137)}...` : value;
}

export function normalizeAccounts(pages: PageObjectResponse[], mapping: RoleMapping): Account[] {
  return pages.map((page) => {
    const lat = propertyNumber(prop(page, mapping.latitude));
    const lng = propertyNumber(prop(page, mapping.longitude));
    return {
      id: page.id,
      url: page.url,
      name: propertyText(prop(page, mapping.name)) ?? "Untitled account",
      address: propertyText(prop(page, mapping.address)),
      lat,
      lng,
      status: propertyText(prop(page, mapping.status)),
      segment: propertyList(prop(page, mapping.segment)),
      badges: propertyList(prop(page, mapping.badges)),
      owner: propertyList(prop(page, mapping.owner))[0] ?? null,
      phone: propertyText(prop(page, mapping.phone)),
      email: propertyText(prop(page, mapping.email)),
      website: propertyText(prop(page, mapping.website)),
      lastTouch: propertyText(prop(page, mapping.lastTouch)),
      notesPreview: notesPreview(propertyText(prop(page, mapping.notes))),
      geocodeStatus: typeof lat === "number" && typeof lng === "number" ? "ok" : "pending",
    };
  });
}

export function buildApiResponse(accounts: Account[], mapping: RoleMapping, demoMode: boolean): ApiDataResponse {
  const statusMap = new Map<string, StatusMeta>();
  for (const account of accounts) {
    if (!account.status) continue;
    const existing = statusMap.get(account.status);
    statusMap.set(account.status, {
      name: account.status,
      color: existing?.color ?? "default",
      count: (existing?.count ?? 0) + 1,
    });
  }

  return {
    accounts,
    statuses: Array.from(statusMap.values()),
    mapping,
    meta: {
      fetchedAt: new Date().toISOString(),
      total: accounts.length,
      unmappedCount: accounts.filter((account) => account.geocodeStatus !== "ok").length,
      demoMode,
    },
  };
}

export function statusColorFromPages(pages: PageObjectResponse[], mapping: RoleMapping, statusName: string): NotionColor {
  const match = pages.find((page) => propertyText(prop(page, mapping.status)) === statusName);
  return propertyOptionColor(match ? prop(match, mapping.status) : undefined) as NotionColor;
}
