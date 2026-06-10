# Atlas for Notion PRD

Atlas is an open-source, map-first CRM for Notion databases. Notion remains the source of truth; Atlas reads an Accounts database and renders every mapped account on a fast MapLibre web app plus a Notion-friendly `/embed` route.

## Goals

- Render a full Notion Accounts database on a map without the native 100-pin ceiling.
- Keep setup simple: paste token, pick database, review suggested fields, render map.
- Keep data portable: Atlas never owns the CRM data.
- Ship a public demo backed by a duplicatable Notion template with a 150-row NYC workspot dataset.
- Provide a guided `/welcome` onboarding path for demo viewers who want to use their own data.

## P0 Scope

- Setup wizard with token validation, database picker, automatic property mapping, and a simple essential-fields review.
- Map and list view with status colors, search, filters, directions, and Open in Notion links.
- Embed mode at `/embed?key=...` with theme, status, center, zoom, and legend query parameters.
- Demo mode with read-only write endpoints, live Notion-backed data, and cache refresh.
- Seed script that creates the demo Accounts database idempotently from `seed/data.json`.
- Public docs, Docker path, Vercel deploy path, and CI.

## Data Contract

An Accounts database needs a title property and either an address property or latitude/longitude number properties. Optional roles include status, segment, badges, owner, phone, email, website, last touch, and notes.

Mappings are stored server-side. Tokens are never serialized to the browser.

## Demo Dataset

`seed/data.json` contains 150 demo rows with names, addresses, coordinates, status values, amenities, website fields when available, last-visit dates, and notes. The first row remains `Housing Works Bookstore Cafe` for the stage-demo search beat.

## Release Gates

- `pnpm check`
- `pnpm perf`
- `pnpm availability`
- Docker build/run smoke
- Vercel production deploy
- GitHub Actions CI
- Public Notion template publishing and duplicate verification
- Mobile QA evidence in `docs/mobile-qa.md`

## Later Roadmap

- Notion OAuth public integration.
- Write-back status and notes.
- Route planning, territories, heatmaps, saved map lenses, and PWA/offline support.
