# Release Verification

Last local verification: 2026-06-12.

## Passing checks

```bash
pnpm check
pnpm perf
pnpm availability
```

Observed results:

- `pnpm check`: passed lint, typecheck, Vitest, production build, secret scan, and Playwright smoke test.
- `pnpm perf`: Lighthouse mobile performance score `99` against the local production demo route.
- `pnpm availability`: `atlas-for-notion` npm package lookup returned not found; `github:atlas-for-notion/atlas-for-notion` lookup returned not found.
- GitHub release repository: `https://github.com/brycejohnson1417/atlas-for-notion`, branch `main`, tag `v0.1.0`.
- GitHub Actions CI on `main`: passed install, Playwright browser install, lint, typecheck, Vitest, production build, secret scan, and Playwright smoke.
- `DEMO_MODE=true EMBED_SHARE_KEY=dev-demo-key vercel build --yes --prod`: passed and wrote `.vercel/output`.
- `https://atlas-for-notion.vercel.app`: public Vercel alias created after disabling Vercel Authentication. The verified deployment `dpl_55HaqmNPysSyS9TJjCvkfNKBk8on` is `Ready`. `/api/data` returns 150 live Notion accounts, `demoMode: true`, 150 unique names, the Housing Works search target, Notion page ids/URLs, and the production mapping (`Name`, `Address`, `Latitude`, `Longitude`, `Status`, `Segment`, `Amenities`, `Website`, `Last Visit`, `Notes`). `/welcome` returns the guided onboarding page. The previous top demo overlay is absent from the public demo.
- `docker build -t atlas-for-notion:local .`: passed after starting OrbStack from CLI with `orb start`.
- `docker run -d -p 3301:3000 -e DEMO_MODE=true -e EMBED_SHARE_KEY=dev-demo-key atlas-for-notion:local` smoke check: `/api/data` returned 150 demo accounts with `demoMode: true`.
- Private Notion companion page created: `https://app.notion.com/p/37ba86d999988101b091e4ccef0ab804`.
- Live Notion seed under the PRD page `30cdd2e535934cc8990577973859bcff` created database `37ba86d9-9998-816b-b5d6-e74c7f401a4c` with 150 accounts. After replacing the generated placeholder dataset with the frozen `seed/data.json` dataset, the old 150 demo rows were archived, 150 replacement rows were created, and a second seed run created `0` new accounts, verifying idempotency.

## Environment-dependent checks

- Domain DNS checks now report `atlas-for-notion.com` and `atlasfornotion.com` as available (`ENOTFOUND`). This is DNS evidence, not a registrar purchase.
- Live Notion seed idempotency requires a real Notion parent page and token. This run used the PRD page as the shared parent, created the live database, and verified a second seed run created `0` new accounts.
- Public Notion template URL still requires publishing the seeded PRD/companion page and enabling duplication in Notion share settings.
- Physical mobile QA is not yet complete; see `docs/mobile-qa.md`.
