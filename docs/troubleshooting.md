# Troubleshooting

## No databases appear

In Notion, open the database, choose `•••`, then `Connections`, and add your integration.

## Invalid token

Use an internal integration token that starts with `ntn_` or `secret_`. If the integration was deleted, create a new one.

## Accounts do not appear on the map

Check that either latitude and longitude are mapped, or the address role is mapped and geocoding can locate the address. Unmapped rows remain in the list with `No location`.

## Embed says invalid key

Confirm the URL has `?key=` and the value matches `EMBED_SHARE_KEY` or the generated share key in `.atlas/config.json`.
