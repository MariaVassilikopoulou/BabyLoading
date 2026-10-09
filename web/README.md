# BabyLoading — web app

React + TypeScript + Vite. Mobile-first: a phone-width column with bottom navigation.
How to run it together with the API is in the [main README](../README.md).

## Screens
- **Today** — a "loading" card that changes with her journey phase:
  *getting ready…* (trying) → *connecting…* (treatment) → *baby loading…* (pregnant, tap the number
  to switch % / days / weeks) → *loaded.* (postpartum). While pregnant, a **loading log** lists
  treatment milestones, entries she pinned, and the dates ahead.
- **Timeline** — every entry, grouped by pregnancy week or month, with filters. The star pins a
  journal entry as a milestone.
- **Log** — mood, symptoms with strength 1–5, notes. Phase and pregnancy week are filled in from the
  current journey.
- **Cycle** — period flow, LH test and temperature, with the fertile-window estimate. Only shown while
  trying or in treatment.

## Calm mode
A switch on Today that removes percentages, countdowns and all "loading" wording. It turns on by
default when a journey ended in loss or was stopped. Stored per device in `localStorage` until real
accounts arrive in Phase 5.

## Design
- Colors, fonts and radii are defined once as CSS variables in `src/index.css` (light and dark).
- Fonts are bundled via `@fontsource-variable` (Fraunces for headings and numbers, Figtree for text),
  so no requests go to Google.
- The app only shows her own data and fixed guidance text; it never interprets values medically.

## Structure
```
src/
  api/client.ts        calls to the API
  lib/dates.ts         local calendar dates and formatting
  lib/journey.ts       pregnancy progress, treatment steps, milestones
  lib/labels.ts        shared wording
  components/          screens and shared pieces
```

## Scripts
`npm run dev` · `npm run build` · `npm run lint`
