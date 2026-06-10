"use client";

import { useEffect, useMemo, useRef } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { StyleSpecification } from "maplibre-gl";
import type { Account, StatusMeta } from "@/lib/types";
import { pinColor } from "@/lib/colors";
import styles from "./atlas.module.css";

interface MapCanvasProps {
  accounts: Account[];
  statuses: StatusMeta[];
  selectedId: string | null;
  center?: [number, number] | null;
  zoom?: number | null;
  onSelect: (id: string) => void;
}

function buildGeoJson(accounts: Account[], statuses: StatusMeta[]) {
  const statusColor = new Map(statuses.map((status) => [status.name, pinColor(status.color)]));
  return {
    type: "FeatureCollection" as const,
    features: accounts
      .filter((account) => account.lat != null && account.lng != null)
      .map((account, index) => {
        const duplicateOffset = ((index % 5) - 2) * 0.00005;
        return {
          type: "Feature" as const,
          properties: {
            id: account.id,
            name: account.name,
            status: account.status ?? "Unassigned",
            pinHex: account.status ? statusColor.get(account.status) ?? pinColor("default") : pinColor("default"),
          },
          geometry: {
            type: "Point" as const,
            coordinates: [Number(account.lng) + duplicateOffset, Number(account.lat) - duplicateOffset],
          },
        };
      }),
  };
}

const rasterMapStyle: StyleSpecification = {
  version: 8,
  glyphs: "https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf",
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "OpenStreetMap",
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster",
      source: "osm",
      paint: {
        "raster-opacity": 0.42,
        "raster-saturation": -0.7,
        "raster-contrast": 0.25,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.78,
      },
    },
  ],
};

export function MapCanvas({ accounts, statuses, selectedId, center, zoom, onSelect }: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<import("maplibre-gl").Map | null>(null);
  const sourceData = useMemo(() => buildGeoJson(accounts, statuses), [accounts, statuses]);
  const latestSourceData = useRef(sourceData);
  latestSourceData.current = sourceData;
  const previewAccounts = accounts.filter((account) => account.lat != null && account.lng != null).slice(0, 32);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let alive = true;
    const startMap = () => {
      void import("maplibre-gl").then((maplibre) => {
      if (!alive || !containerRef.current) return;
      const map = new maplibre.Map({
        container: containerRef.current,
        style: rasterMapStyle,
        center: center ?? [-74.006, 40.7128],
        zoom: zoom ?? 11,
        attributionControl: false,
        scrollZoom: false,
      });
      map.addControl(new maplibre.NavigationControl({ showCompass: false }), "bottom-left");
      map.on("click", () => map.scrollZoom.enable());
      map.on("load", () => {
        map.addSource("accounts", {
          type: "geojson",
          data: latestSourceData.current,
        });
        map.addLayer({
          id: "pins",
          type: "circle",
          source: "accounts",
          paint: {
            "circle-radius": 10,
            "circle-color": "#16191E",
            "circle-stroke-color": ["get", "pinHex"],
            "circle-stroke-width": 3,
            "circle-opacity": 0.94,
          },
        });
        map.on("click", "pins", (event) => {
          const feature = event.features?.[0];
          const id = feature?.properties?.id;
          if (typeof id === "string") onSelect(id);
        });
      });
      mapRef.current = map;
      });
    };
    const timeout = window.setTimeout(startMap, window.innerWidth < 720 ? 6500 : 300);

    return () => {
      alive = false;
      window.clearTimeout(timeout);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [center, onSelect, zoom]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource("accounts") as import("maplibre-gl").GeoJSONSource | undefined;
    source?.setData(sourceData);
    if (map && sourceData.features.length > 0) {
      const lngs = sourceData.features.map((feature) => feature.geometry.coordinates[0]);
      const lats = sourceData.features.map((feature) => feature.geometry.coordinates[1]);
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        { padding: 48, duration: 900, maxZoom: 14 },
      );
    }
  }, [sourceData]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map?.getLayer("pins")) return;
    map.setPaintProperty("pins", "circle-radius", ["case", ["==", ["get", "id"], selectedId ?? ""], 13, 10]);
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const account = accounts.find((candidate) => candidate.id === selectedId);
    if (account?.lat != null && account.lng != null) {
      map.flyTo({ center: [account.lng, account.lat], zoom: Math.max(map.getZoom(), 14), duration: 750 });
    }
  }, [accounts, selectedId]);

  return (
    <div ref={containerRef} className={styles.mapCanvas} aria-label="Atlas account map">
      <div className={styles.staticMapPreview} aria-hidden="true">
        {previewAccounts.map((account, index) => {
          const x = 28 + ((index * 37) % 58);
          const y = 16 + ((index * 53) % 68);
          const color = pinColor(statuses.find((status) => status.name === account.status)?.color);
          return <span key={account.id} style={{ left: `${x}%`, top: `${y}%`, borderColor: color }} />;
        })}
      </div>
    </div>
  );
}
