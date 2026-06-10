import type { PageObjectResponse } from "@notionhq/client/build/src/api-endpoints";

type Property = PageObjectResponse["properties"][string];

function richTextPlain(items: Array<{ plain_text: string }> | undefined) {
  return items?.map((item) => item.plain_text).join("").trim() ?? "";
}

export function propertyText(property: Property | undefined): string | null {
  if (!property) return null;
  switch (property.type) {
    case "title":
      return richTextPlain(property.title) || null;
    case "rich_text":
      return richTextPlain(property.rich_text) || null;
    case "formula":
      return property.formula.type === "string" ? property.formula.string || null : null;
    case "phone_number":
      return property.phone_number || null;
    case "email":
      return property.email || null;
    case "url":
      return property.url || null;
    case "select":
      return property.select?.name ?? null;
    case "status":
      return property.status?.name ?? null;
    case "date":
      return property.date?.start ?? null;
    case "last_edited_time":
      return property.last_edited_time;
    default:
      return null;
  }
}

export function propertyNumber(property: Property | undefined): number | null {
  if (!property) return null;
  if (property.type === "number") {
    return typeof property.number === "number" ? Number(property.number.toFixed(6)) : null;
  }
  if (property.type === "formula" && property.formula.type === "number") {
    return typeof property.formula.number === "number" ? Number(property.formula.number.toFixed(6)) : null;
  }
  return null;
}

export function propertyList(property: Property | undefined): string[] {
  if (!property) return [];
  switch (property.type) {
    case "multi_select":
      return property.multi_select.map((item) => item.name);
    case "select":
      return property.select ? [property.select.name] : [];
    case "status":
      return property.status ? [property.status.name] : [];
    case "people":
      return property.people.map((person) => ("name" in person && person.name ? person.name : person.id));
    case "rich_text": {
      const value = richTextPlain(property.rich_text);
      return value ? [value] : [];
    }
    default:
      return [];
  }
}

export function propertyOptionColor(property: Property | undefined) {
  if (!property) return "default";
  if (property.type === "select") return property.select?.color ?? "default";
  if (property.type === "status") return property.status?.color ?? "default";
  return "default";
}
