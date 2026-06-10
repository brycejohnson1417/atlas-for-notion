import seedData from "@/seed/data.json";
import type { Account, ApiDataResponse, NotionColor, RoleMapping, StatusMeta } from "@/lib/types";

interface SeedAccount {
  name: string;
  type: string;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  status: string;
  amenities: string[];
  website: string | null;
  lastVisit: string;
  notes: string;
}

const mapping: RoleMapping = {
  name: "name",
  address: "address",
  latitude: "lat",
  longitude: "lng",
  status: "status",
  segment: "type",
  badges: "amenities",
  website: "website",
  lastTouch: "lastVisit",
  notes: "notes",
};

function statusColor(name: string): NotionColor {
  const match = seedData.database.statusOptions.find((status) => status.name === name);
  return (match?.color ?? "default") as NotionColor;
}

export function buildDemoAccounts(count = seedData.accounts.length): Account[] {
  return (seedData.accounts as SeedAccount[]).slice(0, count).map((account, index) => ({
    id: `demo-${String(index + 1).padStart(3, "0")}`,
    url: "https://www.notion.so/",
    name: account.name,
    address: account.address,
    lat: account.lat,
    lng: account.lng,
    status: account.status,
    segment: [account.type, account.neighborhood],
    badges: account.amenities,
    owner: index % 4 === 0 ? "Bryce Johnson" : null,
    phone: null,
    email: null,
    website: account.website,
    lastTouch: account.lastVisit,
    notesPreview: account.notes,
    geocodeStatus: "ok",
  }));
}

export function buildDemoResponse(): ApiDataResponse {
  const accounts = buildDemoAccounts();
  const statusNames = seedData.database.statusOptions.map((status) => status.name);
  const statusMeta: StatusMeta[] = statusNames.map((name) => ({
    name,
    color: statusColor(name),
    count: accounts.filter((account) => account.status === name).length,
  }));

  return {
    accounts,
    statuses: statusMeta,
    mapping,
    meta: {
      fetchedAt: new Date().toISOString(),
      total: accounts.length,
      unmappedCount: 0,
      demoMode: true,
    },
  };
}
