# TribeWatch

Find the best places to watch the World Cup with **your** crowd.

## Scaffold

- **Next.js 16** + React 19 + TypeScript + Tailwind 4
- **MapLibre GL** via `react-map-gl/maplibre`
- **OpenFreeMap** basemap (no API key)
- Centers on **user geolocation** (London fallback)
- Sample London watch-spot pins + HUD stubs for Match / Team / Vibe

## Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and allow location access.

## Features

**Finder core**

- **Match / Team / Vibe filters** that actually drive the map
- **Tribe ranking** — venues scored by fan-base fit, vibe, screens, capacity, crowd & distance
- **Ranked results list** (left rail on desktop, bottom sheet on mobile) synced with the map
- **Top-pick highlighting** on the map, plus dimming of non-matching spots
- **Distance from you** and one-tap **Directions**

**Social proof & plans**

- **Live crowd estimates** + busyness per venue for the selected match
- **RSVP** ("I'm in") and **save** favourites — persisted locally
- **Shareable match-day plan** via a deep link (`?plan=…`)

**Real data & reach**

- **Live fixtures** via `/api/fixtures` (football-data.org) with graceful fallback to a bundled sample schedule
- **Real venues from OpenStreetMap** via `/api/osm` (Overpass proxy with User-Agent + mirrors) — "Search this area" works in any city, no key
- **Add your own spot** by dropping a pin on the map
- **Kick-off alerts** for your team, with optional browser notifications

## Configuration

- `FOOTBALL_DATA_API_KEY` (optional): enables live World Cup fixtures from
  [football-data.org](https://www.football-data.org/). Without it, the app uses
  bundled sample fixtures anchored to "today".

## Next

- Persist plans/RSVPs to a backend for real cross-device social proof
- User reviews & photos on venues
- AI concierge: natural-language search with explanations
