"use client";

import { useMemo, useState } from "react";
import { autoDetectMapping, type SchemaProperty } from "@/lib/mapping/auto-detect";
import type { AtlasConfig, RoleMapping } from "@/lib/types";
import styles from "./atlas.module.css";

interface DatabaseSummary {
  id: string;
  title: string;
  icon: string | null;
}

type SetupWizardStep = "token" | "database" | "mapping" | "sync";

const essentialRoleLabels: Array<[keyof RoleMapping, string, string[], string]> = [
  ["name", "Name", ["title"], "Required. Used for pins and account cards."],
  ["address", "Address", ["rich_text", "formula"], "Use this, or map latitude and longitude below."],
  ["latitude", "Latitude", ["number"], "Optional if you have an address."],
  ["longitude", "Longitude", ["number"], "Optional if you have an address."],
  ["status", "Status", ["select", "status"], "Optional. Drives pin colors and status filters."],
  ["badges", "Badges", ["multi_select"], "Optional. Great for amenities or tags."],
];

const advancedRoleLabels: Array<[keyof RoleMapping, string, string[], string]> = [
  ["segment", "Segment", ["select", "multi_select"], "Optional secondary filter."],
  ["owner", "Owner", ["people", "select"], "Optional my-accounts filter."],
  ["phone", "Phone", ["phone_number"], "Optional quick action."],
  ["email", "Email", ["email"], "Optional quick action."],
  ["website", "Website", ["url"], "Optional quick action."],
  ["lastTouch", "Last touch", ["date", "last_edited_time"], "Optional stale-account filter."],
  ["notes", "Notes", ["rich_text"], "Optional card preview text."],
];

const setupSteps: Array<[Exclude<SetupWizardStep, "sync">, string]> = [
  ["token", "Connect"],
  ["database", "Choose"],
  ["mapping", "Review"],
];

export function SetupWizard() {
  const [step, setStep] = useState<SetupWizardStep>("token");
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [botName, setBotName] = useState<string | null>(null);
  const [databases, setDatabases] = useState<DatabaseSummary[]>([]);
  const [databaseId, setDatabaseId] = useState("");
  const [properties, setProperties] = useState<SchemaProperty[]>([]);
  const [mapping, setMapping] = useState<Partial<RoleMapping>>({});
  const [saving, setSaving] = useState(false);

  const selectedDatabase = useMemo(
    () => databases.find((database) => database.id === databaseId) ?? null,
    [databaseId, databases],
  );

  async function validateToken() {
    setError(null);
    const response = await fetch("/api/setup/validate-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const json = await response.json() as { ok?: boolean; botName?: string; error?: string };
    if (!response.ok) {
      setError("That token didn't work. Check that it starts with \"ntn_\" or \"secret_\" and that the integration still exists.");
      return;
    }
    setBotName(json.botName ?? "Notion integration");
    const databaseResponse = await fetch("/api/setup/databases");
    const databaseJson = await databaseResponse.json() as { databases?: DatabaseSummary[] };
    setDatabases(databaseJson.databases ?? []);
    setStep("database");
  }

  async function chooseDatabase(nextDatabaseId: string) {
    setDatabaseId(nextDatabaseId);
    setError(null);
    const response = await fetch(`/api/setup/database/${nextDatabaseId}`);
    const json = await response.json() as { properties?: SchemaProperty[]; error?: string };
    if (!response.ok || !json.properties) {
      setError("No databases are shared with this integration yet. In Notion, open your database → ••• → Connections → add your integration.");
      return;
    }
    setProperties(json.properties);
    try {
      setMapping(autoDetectMapping(json.properties));
    } catch {
      setMapping({});
    }
    setStep("mapping");
  }

  async function saveMapping() {
    if (!mapping.name || !databaseId) return;
    setSaving(true);
    setError(null);
    const config: AtlasConfig = {
      accountsDatabaseId: databaseId,
      mapping: mapping as RoleMapping,
      geocoder: "nominatim",
      writeBackCoordinates: false,
    };
    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    if (!response.ok) {
      setError("Setup could not be saved. Check the database sharing settings and try again.");
      setSaving(false);
      return;
    }
    setStep("sync");
    window.setTimeout(() => window.location.assign("/"), 900);
  }

  const compatible = (types: string[]) => properties.filter((property) => types.includes(property.type));
  const canRender = Boolean(mapping.name && (mapping.address || (mapping.latitude && mapping.longitude)));

  const roleSelect = ([role, label, types, helper]: [keyof RoleMapping, string, string[], string]) => (
    <label key={role}>
      <span>{label}{role === "name" ? " *" : ""}</span>
      <select
        value={mapping[role] ?? ""}
        onChange={(event) => setMapping((current) => ({ ...current, [role]: event.target.value || undefined }))}
      >
        <option value="">Not mapped</option>
        {compatible(types).map((property) => (
          <option key={property.id} value={property.id}>{property.name}</option>
        ))}
      </select>
      <small>{helper}</small>
    </label>
  );

  return (
    <main className={styles.setup}>
      <section className={styles.setupPanel}>
        <div className={styles.logoMark}>A</div>
        <ol className={styles.setupSteps}>
          {setupSteps.map(([stepName, label]) => (
            <li key={stepName} className={step === stepName ? styles.setupStepActive : styles.setupStep}>
              {label}
            </li>
          ))}
        </ol>
        {step === "token" ? (
          <>
            <h1>Connect your Notion integration</h1>
            <p>Create an internal integration at notion.so/my-integrations, then share your database with it.</p>
            <p className={styles.setupSubcopy}>Atlas keeps the token server-side and only reads databases you explicitly share with the integration.</p>
            <div className={styles.setupChecklist}>
              <span>1. Create an integration at notion.so/my-integrations</span>
              <span>2. Open your Accounts database → Connections → add it</span>
              <span>3. Paste the token here</span>
            </div>
            <form className={styles.setupForm} onSubmit={(event) => { event.preventDefault(); void validateToken(); }}>
              <input value={token} onChange={(event) => setToken(event.target.value)} type="password" placeholder="ntn_... or secret_..." aria-label="Notion token" />
              <button type="submit" disabled={token.trim().length < 8}>Continue</button>
            </form>
          </>
        ) : null}

        {step === "database" ? (
          <>
            <h1>Choose your Accounts database</h1>
            <p>{botName} is connected. Pick the database with your locations; Atlas only needs one.</p>
            {databases.length === 0 ? (
              <p className={styles.errorText}>No databases are shared with this integration yet. In Notion, open your database → ••• → Connections → add your integration.</p>
            ) : (
              <div className={styles.databaseList}>
                {databases.map((database) => (
                  <button key={database.id} onClick={() => void chooseDatabase(database.id)}>
                    <span>{database.icon ?? "▦"}</span>
                    {database.title}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : null}

        {step === "mapping" ? (
          <>
            <h1>Review suggested fields</h1>
            <p>{selectedDatabase?.title ?? "Accounts"} is ready. Atlas pre-filled the essentials; most databases can render from this screen without changing anything.</p>
            <div className={styles.mappingTable}>
              {essentialRoleLabels.map(roleSelect)}
            </div>
            <details className={styles.advancedMapping}>
              <summary>Advanced optional fields</summary>
              <div className={styles.mappingTable}>
                {advancedRoleLabels.map(roleSelect)}
              </div>
            </details>
            {!canRender ? <p className={styles.errorText}>Map a name and either an address or latitude and longitude to render the map.</p> : null}
            <div className={styles.setupActions}>
              <button className={styles.secondarySetupButton} onClick={() => setStep("database")}>Back</button>
              <button className={styles.primarySetupButton} disabled={!canRender || saving} onClick={() => void saveMapping()}>
                {saving ? "Mapping your accounts..." : "Render map"}
              </button>
            </div>
          </>
        ) : null}

        {step === "sync" ? (
          <>
            <h1>Mapping your accounts… 0 of 0 located</h1>
            <p>Atlas is saving your mapping and loading the first map.</p>
          </>
        ) : null}

        {error ? <p className={styles.errorText}>{error}</p> : null}
      </section>
    </main>
  );
}
