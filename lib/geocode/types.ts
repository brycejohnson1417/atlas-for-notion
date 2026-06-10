export interface GeocodeResult {
  lat: number;
  lng: number;
  status: "ok" | "failed";
  reason?: string;
}

export interface Geocoder {
  geocode(address: string): Promise<GeocodeResult>;
}
