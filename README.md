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

## Next

- Pull real fixtures
- Nearby venues from OpenStreetMap
- Tribe ranking + AI explanations
