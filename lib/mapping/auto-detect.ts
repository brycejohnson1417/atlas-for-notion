import type { RoleMapping } from "@/lib/types";

export interface SchemaProperty {
  id: string;
  name: string;
  type: string;
}

const rolePatterns: Array<[keyof RoleMapping, RegExp, Set<string>]> = [
  ["name", /^(name|account|company|title)$/i, new Set(["title"])],
  ["address", /address|location|street/i, new Set(["rich_text", "formula"])],
  ["latitude", /^(lat|latitude)$/i, new Set(["number"])],
  ["longitude", /^(lng|lon|long|longitude)$/i, new Set(["number"])],
  ["status", /status|stage|state/i, new Set(["select", "status"])],
  ["segment", /segment|type|tier|category|neighborhood/i, new Set(["select", "multi_select"])],
  ["badges", /badge|amenit|tag|feature/i, new Set(["multi_select"])],
  ["owner", /owner|rep|assignee/i, new Set(["people", "select"])],
  ["phone", /phone|tel/i, new Set(["phone_number"])],
  ["email", /email/i, new Set(["email"])],
  ["website", /web|url|site/i, new Set(["url"])],
  ["lastTouch", /last.*(touch|visit|contact|edited)|updated/i, new Set(["date", "last_edited_time"])],
  ["notes", /notes?|description|summary/i, new Set(["rich_text"])],
];

export function autoDetectMapping(properties: SchemaProperty[]): RoleMapping {
  const mapping: Partial<RoleMapping> = {};
  for (const [role, pattern, acceptedTypes] of rolePatterns) {
    const match = properties.find((property) => acceptedTypes.has(property.type) && pattern.test(property.name));
    if (match) {
      mapping[role] = match.id;
    }
  }
  const title = properties.find((property) => property.type === "title");
  if (!mapping.name && title) {
    mapping.name = title.id;
  }
  if (!mapping.name) {
    throw new Error("No title property found for required name role.");
  }
  return mapping as RoleMapping;
}
