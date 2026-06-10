import { describe, expect, it } from "vitest";
import { autoDetectMapping } from "@/lib/mapping/auto-detect";

describe("autoDetectMapping", () => {
  it("detects a clean demo schema", () => {
    const mapping = autoDetectMapping([
      { id: "title-id", name: "Name", type: "title" },
      { id: "address-id", name: "Address", type: "rich_text" },
      { id: "lat-id", name: "Latitude", type: "number" },
      { id: "lng-id", name: "Longitude", type: "number" },
      { id: "status-id", name: "Status", type: "select" },
    ]);
    expect(mapping).toMatchObject({
      name: "title-id",
      address: "address-id",
      latitude: "lat-id",
      longitude: "lng-id",
      status: "status-id",
    });
  });

  it("handles messy property names", () => {
    const mapping = autoDetectMapping([
      { id: "a", name: "Account", type: "title" },
      { id: "b", name: "Street Location", type: "rich_text" },
      { id: "c", name: "Rep", type: "people" },
    ]);
    expect(mapping.name).toBe("a");
    expect(mapping.address).toBe("b");
    expect(mapping.owner).toBe("c");
  });
});
