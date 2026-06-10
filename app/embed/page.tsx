import { AtlasApp } from "@/components/atlas/atlas-app";
import { getEmbedShareKey } from "@/lib/config";
import { getStoredConfig } from "@/lib/config-store";
import styles from "./page.module.css";

interface EmbedPageProps {
  searchParams: Promise<{
    key?: string;
    theme?: string;
    status?: string;
    center?: string;
    zoom?: string;
    legend?: string;
  }>;
}

function parseTheme(value: string | undefined): "dark" | "light" | "auto" {
  return value === "light" || value === "auto" ? value : "dark";
}

function parseCenter(value: string | undefined): [number, number] | null {
  if (!value) return null;
  const [lat, lng] = value.split(",").map((part) => Number(part.trim()));
  return Number.isFinite(lat) && Number.isFinite(lng) ? [lng, lat] : null;
}

function parseZoom(value: string | undefined) {
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

export default async function EmbedPage({ searchParams }: EmbedPageProps) {
  const params = await searchParams;
  const stored = await getStoredConfig();
  const shareKey = process.env.EMBED_SHARE_KEY ?? stored?.embedShareKey ?? getEmbedShareKey();
  if (params.key !== shareKey) {
    return (
      <main className={styles.invalid}>
        <section>
          <h1>Invalid embed key</h1>
          <p>This Atlas embed is read-only and needs a valid share key.</p>
        </section>
      </main>
    );
  }

  return (
    <AtlasApp
      embed
      theme={parseTheme(params.theme)}
      center={parseCenter(params.center)}
      zoom={parseZoom(params.zoom)}
      initialStatus={params.status ?? null}
      showLegend={params.legend !== "false"}
    />
  );
}
