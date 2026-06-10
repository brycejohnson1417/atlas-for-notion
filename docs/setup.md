# Setup

Atlas is a single-tenant self-hosted app in v0.1.

1. Create an internal Notion integration at `notion.so/my-integrations`.
2. Share your Accounts database with that integration.
3. Run Atlas:

```bash
pnpm i
pnpm dev
```

4. Paste the token into the setup wizard.
5. Pick the Accounts database.
6. Review the auto-detected property mapping and render the map.

The token is sent once to the server and stored in `.atlas/config.json` or `ATLAS_DATA_DIR/config.json`. It is never serialized in `/api/data` or client bundles.
