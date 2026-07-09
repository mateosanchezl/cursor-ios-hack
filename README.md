# TribeWatch

Find the best places to watch the World Cup with **your** crowd.

## Stack

- **Next.js 16** + React 19 + TypeScript + Tailwind 4
- **MapLibre GL** via `react-map-gl/maplibre`
- **OpenFreeMap** basemap (no API key)
- Centers on **user geolocation** (London fallback)

## Data (Phase 1 — real data)

- **Venues** come live from **OpenStreetMap** via the Overpass API, queried for
  the current map viewport (`GET /api/venues?south&west&north&east`). Results are
  cached for a day and the request bbox is snapped to a grid to maximise cache
  hits. Data © OpenStreetMap contributors (ODbL).
- **Fixtures** come from **football-data.org** (`GET /api/fixtures`), cached for
  an hour. Set a `FOOTBALL_DATA_API_KEY` env var to enable them; without it the
  app still runs and the fixtures strip shows a configuration hint.

## Run

```bash
npm install
echo "FOOTBALL_DATA_API_KEY=your_key_here" > .env.local   # optional
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and allow location access.

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `FOOTBALL_DATA_API_KEY` | Optional | Enables the live World Cup fixtures strip via football-data.org. |

On Vercel, add `FOOTBALL_DATA_API_KEY` under Project → Settings → Environment
Variables (Production + Preview) so the deployed app can load fixtures.

## Next (Phase 2+)

- Database + crowdsourced "showing this match here" layer and tribe RSVPs
- Working Match / Team / Vibe filters against real data
- Venue enrichment (photos, hours, ratings) and AI natural-language search
