# Mobile QA

Status: pending physical-device verification.

The current automated checks cover responsive rendering through Playwright and Lighthouse mobile emulation. The PRD now requires physical-device verification before the release can be considered complete.

## Required Matrix

- iOS Safari on a physical iPhone.
- Android Chrome on a physical mid-range Android device.
- Notion mobile app embed behavior.
- Notion desktop/web embed scroll behavior.

## Checks

- Initial load under 3 seconds on throttled 4G.
- No horizontal scroll at 360px width.
- Tap targets at least 44px for primary controls.
- Map pan/pinch does not hijack Notion page scroll before focus.
- `/welcome` flow can take a first-time user to a rendered map.
- Full demo script runs end to end on phone.
