export type NotionColor =
  | "default" | "gray" | "brown" | "orange" | "yellow"
  | "green" | "blue" | "purple" | "pink" | "red";

export type GeocodeStatus = "ok" | "pending" | "failed" | "manual";

export interface Account {
  id: string;
  url: string;
  name: string;
  address: string | null;
  lat: number | null;
  lng: number | null;
  status: string | null;
  segment: string[];
  badges: string[];
  owner: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  lastTouch: string | null;
  notesPreview: string | null;
  geocodeStatus: GeocodeStatus;
}

export interface StatusMeta {
  name: string;
  color: NotionColor;
  count: number;
}

export interface RoleMapping {
  name: string;
  address?: string;
  latitude?: string;
  longitude?: string;
  status?: string;
  segment?: string;
  badges?: string;
  owner?: string;
  phone?: string;
  email?: string;
  website?: string;
  lastTouch?: string;
  notes?: string;
}

export interface AtlasConfig {
  accountsDatabaseId: string;
  mapping: RoleMapping;
  geocoder: "nominatim" | "census" | "mapbox" | "google";
  writeBackCoordinates: boolean;
}

export interface ApiDataResponse {
  accounts: Account[];
  statuses: StatusMeta[];
  mapping: RoleMapping;
  meta: {
    fetchedAt: string;
    total: number;
    unmappedCount: number;
    demoMode: boolean;
  };
}
