# Geocoding

Atlas ships with keyless geocoding options:

- `nominatim`: default, one request per second, cached forever by address hash.
- `census`: US Census geocoder, useful for US addresses.

Set `GEOCODER=nominatim` or `GEOCODER=census`.

Addresses are sent to the selected geocoder. Demo data includes frozen latitude and longitude values so the public demo does not depend on live geocoding.
