# Decisions

- The repo folder is named `Notion Atlas`, but the package name is `atlas-for-notion` to satisfy npm package-name rules.
- Demo mode falls back to frozen local demo data when `DEMO_NOTION_TOKEN` is absent, so local demo work is not blocked by live Notion credentials.
- Runtime config can come from env vars or the filesystem-backed setup wizard. Env vars win when both are present, which keeps deployment behavior explicit.
- `seed/data.json` keeps the PRD contract shape while the seed script generates the full 150-row demo set from the typed demo data builder to avoid duplicating static rows.
- The v0.1 write endpoint is hard-disabled with the required `403 {"error":"demo_mode"}` response.
- Config persistence now uses `.atlas/config.json` by default, or `ATLAS_DATA_DIR/config.json` in Docker, to keep the v0.1 self-host path dependency-free.
- Demo mode uses live Notion data when `DEMO_NOTION_TOKEN` and `ACCOUNTS_DATABASE_ID` are provided; otherwise it falls back to deterministic local demo data so no-env local demos still work.
- The default map style uses keyless OpenStreetMap raster tiles with MapLibre because OpenFreeMap glyph requests were unreliable in local verification; `MAP_TILE_URL` remains documented for deployments that want a vector style.
- Release evidence is written to local `reports/` files and kept out of git by default; it can be regenerated with `pnpm perf` and `pnpm availability`.
- Direct pins replaced clustered pins after product feedback. Duplicate-coordinate jitter remains so overlapping accounts stay clickable.
- The demo banner overlay was removed after product feedback. The `/welcome` route is the onboarding entry point instead of a floating demo CTA.
- Public docs exports intentionally omit internal company/time-specific story details and point readers to the evergreen Atlas narrative.
