# Contributing

Thanks for helping improve Atlas.

## Local development

```bash
pnpm i
DEMO_MODE=true EMBED_SHARE_KEY=dev-demo-key pnpm dev
```

Before opening a pull request:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm secret-scan
pnpm smoke
```

Keep Notion tokens server-side only. Do not add sample credentials to fixtures, screenshots, docs, or tests.
