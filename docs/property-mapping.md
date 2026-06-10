# Property Mapping

Atlas maps existing Notion properties into semantic roles.

Required:

- `name`: title property.
- `address`: rich text or formula string, unless latitude and longitude are already mapped.

Optional:

- `latitude`, `longitude`: number properties.
- `status`: select or status.
- `segment`: select or multi-select.
- `badges`: multi-select.
- `owner`: person or select.
- `phone`, `email`, `website`.
- `lastTouch`: date or last edited time.
- `notes`: rich text.

Atlas stores property IDs, not names, so property renames do not break a saved mapping.
