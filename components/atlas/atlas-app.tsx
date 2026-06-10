"use client";

import { useEffect, useMemo, useState } from "react";
import { Command } from "cmdk";
import { LocateFixed, Mail, MapPin, Navigation, Phone, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import type { Account, ApiDataResponse, StatusMeta } from "@/lib/types";
import { pinColor } from "@/lib/colors";
import { MapCanvas } from "@/components/atlas/map-canvas";
import { SetupWizard } from "@/components/atlas/setup-wizard";
import styles from "./atlas.module.css";

type SortKey = "name" | "status" | "lastTouch" | "distance";
const STALE_DAYS = 30;

interface AtlasAppProps {
  embed?: boolean;
  initialStatus?: string | null;
  showLegend?: boolean;
  theme?: "dark" | "light" | "auto";
  center?: [number, number] | null;
  zoom?: number | null;
}

function distanceMiles(a: Account, origin: GeolocationPosition | null) {
  if (!origin || a.lat == null || a.lng == null) return Number.POSITIVE_INFINITY;
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earth = 3958.8;
  const dLat = toRad(a.lat - origin.coords.latitude);
  const dLng = toRad(a.lng - origin.coords.longitude);
  const lat1 = toRad(origin.coords.latitude);
  const lat2 = toRad(a.lat);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return earth * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function EmptyState({ error }: { error: string }) {
  if (error === "not_configured") {
    return <SetupWizard />;
  }
  return (
    <main className={styles.setup}>
      <section className={styles.setupPanel}>
        <h1>Atlas could not load data</h1>
        <p>{error === "notion_unreachable" ? "Notion is unreachable right now." : "No accounts match these filters."}</p>
      </section>
    </main>
  );
}

function AccountActions({ account }: { account: Account }) {
  const directions = account.address
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(account.address)}`
    : account.lat != null && account.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${account.lat},${account.lng}`
      : null;

  return (
    <div className={styles.actions}>
      {directions ? <a href={directions} target="_blank" rel="noreferrer"><Navigation size={15} />Directions</a> : null}
      {account.phone ? <a href={`tel:${account.phone}`}><Phone size={15} />Call</a> : null}
      {account.email ? <a href={`mailto:${account.email}`}><Mail size={15} />Email</a> : null}
      <a href={account.url} target="_blank" rel="noreferrer"><MapPin size={15} />Open in Notion</a>
    </div>
  );
}

function AccountCard({ account, onClose }: { account: Account; onClose?: () => void }) {
  return (
    <article className={styles.accountCard}>
      <div className={styles.cardHeader}>
        <div>
          <h2>{account.name}</h2>
          <p>{account.address ?? "No location"}</p>
        </div>
        {onClose ? <button className={styles.iconButton} onClick={onClose} aria-label="Close">x</button> : null}
      </div>
      <div className={styles.chipRow}>
        {account.status ? <span className={styles.statusPill}>{account.status}</span> : null}
        {account.badges.map((badge) => <span key={badge} className={styles.badge}>{badge}</span>)}
        {account.geocodeStatus !== "ok" ? <span className={styles.badge}>No location</span> : null}
      </div>
      {account.notesPreview ? <p className={styles.notes}>{account.notesPreview}</p> : null}
      <AccountActions account={account} />
    </article>
  );
}

function isStale(account: Account) {
  if (!account.lastTouch) return true;
  const touchedAt = new Date(`${account.lastTouch}T00:00:00.000Z`).getTime();
  if (!Number.isFinite(touchedAt)) return true;
  return Date.now() - touchedAt > STALE_DAYS * 24 * 60 * 60 * 1000;
}

function Legend({
  statuses,
  selected,
  onToggle,
}: {
  statuses: StatusMeta[];
  selected: Set<string>;
  onToggle: (status: string) => void;
}) {
  return (
    <div className={styles.legend}>
      {statuses.map((status) => {
        const active = selected.size === 0 || selected.has(status.name);
        return (
          <button
            key={status.name}
            className={active ? styles.legendChipActive : styles.legendChip}
            onClick={() => onToggle(status.name)}
          >
            <span style={{ background: pinColor(status.color) }} />
            {status.name}
            <b>{status.count}</b>
          </button>
        );
      })}
    </div>
  );
}

export function AtlasApp({ embed = false, initialStatus = null, showLegend = true, theme = "dark", center = null, zoom = null }: AtlasAppProps) {
  const [data, setData] = useState<ApiDataResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<Set<string>>(() => initialStatus ? new Set([initialStatus]) : new Set());
  const [selectedSegment, setSelectedSegment] = useState("");
  const [selectedBadges, setSelectedBadges] = useState<Set<string>>(() => new Set());
  const [myAccountsOnly, setMyAccountsOnly] = useState(false);
  const [staleOnly, setStaleOnly] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("name");
  const [commandOpen, setCommandOpen] = useState(false);
  const [position, setPosition] = useState<GeolocationPosition | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const resolvedTheme = theme === "auto"
      ? window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
      : theme;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [theme]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/data")
      .then(async (response) => {
        const json = await response.json();
        if (!response.ok) throw new Error(json.error ?? "load_failed");
        return json as ApiDataResponse;
      })
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((loadError: unknown) => {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "load_failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const filterOptions = useMemo(() => {
    const accounts = data?.accounts ?? [];
    return {
      segments: Array.from(new Set(accounts.flatMap((account) => account.segment))).sort((left, right) => left.localeCompare(right)),
      badges: Array.from(new Set(accounts.flatMap((account) => account.badges))).sort((left, right) => left.localeCompare(right)),
      hasOwners: accounts.some((account) => account.owner),
    };
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const needle = query.trim().toLowerCase();
    const filteredAccounts = data.accounts.filter((account) => {
      const statusMatch = selectedStatuses.size === 0 || (account.status ? selectedStatuses.has(account.status) : false);
      const segmentMatch = !selectedSegment || account.segment.includes(selectedSegment);
      const badgeMatch = selectedBadges.size === 0 || account.badges.some((badge) => selectedBadges.has(badge));
      const ownerMatch = !myAccountsOnly || Boolean(account.owner);
      const staleMatch = !staleOnly || isStale(account);
      const queryMatch = !needle || [account.name, account.address, account.notesPreview, ...account.segment, ...account.badges]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(needle);
      return statusMatch && segmentMatch && badgeMatch && ownerMatch && staleMatch && queryMatch;
    });
    return [...filteredAccounts].sort((left, right) => {
      const mappedOrder = Number(left.geocodeStatus !== "ok") - Number(right.geocodeStatus !== "ok");
      if (mappedOrder !== 0) return mappedOrder;
      if (sort === "status") return (left.status ?? "").localeCompare(right.status ?? "") || left.name.localeCompare(right.name);
      if (sort === "lastTouch") return (right.lastTouch ?? "").localeCompare(left.lastTouch ?? "");
      if (sort === "distance") return distanceMiles(left, position) - distanceMiles(right, position);
      return left.name.localeCompare(right.name);
    });
  }, [data, myAccountsOnly, position, query, selectedBadges, selectedSegment, selectedStatuses, sort, staleOnly]);

  const selectedAccount = data?.accounts.find((account) => account.id === selectedAccountId) ?? filtered[0] ?? null;

  if (error) return <EmptyState error={error} />;
  if (!data) {
    return (
      <main className={styles.loading}>
        <div className={styles.logoMark}>A</div>
        <p>Mapping your accounts... 0 of 0 located</p>
      </main>
    );
  }

  const toggleStatus = (status: string) => {
    setSelectedStatuses((current) => {
      const next = new Set(current);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const toggleBadge = (badge: string) => {
    setSelectedBadges((current) => {
      const next = new Set(current);
      if (next.has(badge)) next.delete(badge);
      else next.add(badge);
      return next;
    });
  };

  const locate = () => {
    navigator.geolocation.getCurrentPosition(
      (nextPosition) => {
        setPosition(nextPosition);
        setSort("distance");
      },
      () => {
        setToast("Location permission denied - sort by distance is unavailable.");
        window.setTimeout(() => setToast(null), 4000);
      },
    );
  };

  return (
    <main className={embed ? styles.embedShell : styles.shell}>
      <section className={styles.mapStage}>
        <MapCanvas accounts={filtered} statuses={data.statuses} selectedId={selectedAccountId} center={center} zoom={zoom} onSelect={setSelectedAccountId} />
        <div className={styles.topControls}>
          <label className={styles.searchBox}>
            <Search size={16} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search accounts" />
          </label>
          {!embed ? <button className={styles.iconButton} onClick={() => setCommandOpen(true)} aria-label="Open command search">⌘K</button> : null}
          <button className={styles.iconButton} onClick={locate} aria-label="Locate me"><LocateFixed size={17} /></button>
          {!embed ? (
            <select className={styles.sortSelect} value={sort} onChange={(event) => setSort(event.target.value as SortKey)} aria-label="Sort accounts">
              <option value="name">Name</option>
              <option value="status">Status</option>
              <option value="lastTouch">Last touch</option>
              <option value="distance">Distance</option>
            </select>
          ) : null}
        </div>
        {showLegend ? <Legend statuses={data.statuses} selected={selectedStatuses} onToggle={toggleStatus} /> : null}
        {embed ? <a className={styles.embedLink} href="/" target="_blank" rel="noreferrer">Open full app ↗</a> : null}
        {selectedAccount ? <div className={styles.mobileCard}><AccountCard account={selectedAccount} onClose={() => setSelectedAccountId(null)} /></div> : null}
      </section>
      {!embed ? (
        <aside className={styles.sidePanel}>
          <div className={styles.panelTitle}>
            <div>
              <h1>Atlas</h1>
              <p>{filtered.length} of {data.meta.total} accounts</p>
            </div>
            <button className={styles.refreshButton} onClick={() => window.location.reload()}><RefreshCw size={15} />Refresh</button>
          </div>
          <div className={styles.filterHint}><SlidersHorizontal size={15} /> Filters compose across map and list.</div>
          <div className={styles.filterStack}>
            <label>
              <span>Segment</span>
              <select value={selectedSegment} onChange={(event) => setSelectedSegment(event.target.value)}>
                <option value="">All segments</option>
                {filterOptions.segments.map((segment) => <option key={segment} value={segment}>{segment}</option>)}
              </select>
            </label>
            <div className={styles.inlineFilters}>
              {filterOptions.badges.map((badge) => (
                <button
                  key={badge}
                  className={selectedBadges.has(badge) ? styles.filterChipActive : styles.filterChip}
                  onClick={() => toggleBadge(badge)}
                >
                  {badge}
                </button>
              ))}
            </div>
            <div className={styles.switchRow}>
              <label>
                <input type="checkbox" checked={myAccountsOnly} disabled={!filterOptions.hasOwners} onChange={(event) => setMyAccountsOnly(event.target.checked)} />
                My accounts
              </label>
              <label>
                <input type="checkbox" checked={staleOnly} onChange={(event) => setStaleOnly(event.target.checked)} />
                Stale {STALE_DAYS}d
              </label>
            </div>
          </div>
          {selectedAccount ? <AccountCard account={selectedAccount} /> : null}
          <div className={styles.list}>
            {filtered.length === 0 ? <p className={styles.zero}>No accounts match these filters.</p> : null}
            {filtered.map((account) => (
              <button
                key={account.id}
                className={selectedAccountId === account.id ? styles.rowSelected : styles.row}
                onClick={() => setSelectedAccountId(account.id)}
              >
                <span className={styles.rowPin} style={{ background: pinColor(data.statuses.find((status) => status.name === account.status)?.color) }} />
                <span>
                  <strong>{account.name}</strong>
                  <small>{account.address ?? "No location"}</small>
                </span>
              </button>
            ))}
          </div>
        </aside>
      ) : null}
      {commandOpen ? (
        <div className={styles.commandOverlay} onMouseDown={() => setCommandOpen(false)}>
          <Command className={styles.command} onMouseDown={(event) => event.stopPropagation()}>
            <Command.Input placeholder="Search accounts..." />
            <Command.List>
              {data.accounts.map((account) => (
                <Command.Item
                  key={account.id}
                  value={`${account.name} ${account.address ?? ""}`}
                  onSelect={() => {
                    setSelectedAccountId(account.id);
                    setCommandOpen(false);
                  }}
                >
                  <strong>{account.name}</strong>
                  <span>{account.address}</span>
                </Command.Item>
              ))}
            </Command.List>
          </Command>
        </div>
      ) : null}
      {toast ? <div className={styles.toast}>{toast}</div> : null}
    </main>
  );
}
