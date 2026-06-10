# How Atlas Was Built

Atlas started from a common workflow: teams keep their CRM in Notion, but need a real geographic view of every account. The product keeps Notion as the system of record and adds a fast map, filters, account cards, and an embed route that can live inside a Notion page.

## Architecture

- Next.js 15 App Router for the app and API routes.
- `@notionhq/client` runs server-side only.
- MapLibre renders the map with keyless OpenStreetMap raster tiles by default.
- A small semantic mapping layer translates arbitrary Notion schemas into Atlas roles.
- File-backed setup/config storage keeps self-hosting dependency-free.
- A deterministic seed dataset supports the public demo and local fallback.

## Important Implementation Choices

- The setup wizard starts with essential fields and hides optional mappings behind an advanced disclosure.
- Demo mode can use live Notion data when credentials are present, or frozen local data when they are not.
- The embed route requires a share key but never exposes the Notion token.
- Direct pins are used instead of clustering per product feedback for the public demo.
- The top demo overlay was removed per product feedback; `/welcome` is the guided onboarding entry point.

## Verification

Release verification lives in `docs/release-verification.md`. The current release path covers local checks, GitHub CI, Vercel deployment, live Notion data, seed idempotency, Docker smoke, and performance evidence.
