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

- **Match / Team / Vibe filters** that actually drive the map
- **Tribe ranking** — venues scored by fan-base fit, vibe, screens, capacity & distance
- **Ranked results list** (left rail on desktop, bottom sheet on mobile) synced with the map
- **Top-pick highlighting** on the map, plus dimming of non-matching spots
- **Distance from you** and one-tap **Directions**
- Sample knockout-stage **fixtures** anchored to "today" so the schedule always feels live

## Next

- Pull real fixtures from a live API
- Nearby venues from OpenStreetMap (Overpass) so it works in any city
- Live crowd / headcount + RSVP for social proof
- Save favourites and share a match-day plan
- AI concierge: natural-language search with explanations
