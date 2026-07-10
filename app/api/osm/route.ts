import type { NextRequest } from "next/server";
import type { Venue } from "@/lib/types";

/**
 * Overpass rejects browser User-Agents with HTTP 406, and browsers cannot set
 * a custom User-Agent. Proxy through this route with an identifying UA.
 * Try a few public mirrors — the primary instance is often busy (504).
 */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://lz4.overpass-api.de/api/interpreter",
  "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
] as const;

const USER_AGENT =
  "TribeWatch/1.0 (https://github.com/mateosanchezl/cursor-ios-hack; contact: mateosanchez.msl@gmail.com)";

const MAX_RADIUS_M = 5000;
const DEFAULT_RADIUS_M = 1500;
const DEFAULT_LIMIT = 40;
const MAX_LIMIT = 80;

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OverpassElement[] };

type OsmVenuesResponse = {
  venues: Venue[];
  error?: string;
};

function vibesFromTags(tags: Record<string, string>): string[] {
  const vibes: string[] = [];
  const outdoor = tags["outdoor_seating"];
  if ((outdoor && outdoor !== "no") || tags["biergarten"]) {
    vibes.push("outdoor");
  }
  if (
    tags["live_sport"] === "yes" ||
    tags["sport"] ||
    tags["tv"] === "yes"
  ) {
    vibes.push("big-screen");
  }
  if (tags["food"] === "yes" || tags["cuisine"]) {
    vibes.push("food");
  }
  if (vibes.length === 0) vibes.push("chill");
  return vibes;
}

function areaFromTags(tags: Record<string, string>): string {
  return (
    tags["addr:suburb"] ||
    tags["addr:neighbourhood"] ||
    tags["addr:city"] ||
    "Nearby"
  );
}

function parseNumber(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function toVenue(element: OverpassElement): Venue | null {
  const tags = element.tags ?? {};
  const name = tags["name"]?.trim();
  if (!name) return null;

  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (lat == null || lng == null) return null;

  return {
    id: `osm-${element.type}-${element.id}`,
    name,
    lat,
    lng,
    area: areaFromTags(tags),
    fanBases: ["neutral"],
    screens: "medium",
    seating: "mixed",
    vibes: vibesFromTags(tags),
    source: "osm",
  };
}

async function queryOverpass(query: string): Promise<OverpassResponse> {
  let lastError: Error | null = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 18_000);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
        },
        body: `data=${encodeURIComponent(query)}`,
        signal: controller.signal,
        // Venue POIs change slowly; cache successful responses for a day.
        next: { revalidate: 86_400 },
      });

      if (!response.ok) {
        lastError = new Error(`overpass_${response.status}`);
        continue;
      }

      return (await response.json()) as OverpassResponse;
    } catch (error) {
      lastError =
        error instanceof Error ? error : new Error("overpass_unreachable");
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError ?? new Error("overpass_unreachable");
}

/**
 * GET /api/osm?lat=&lng=&radius=&limit=
 * Returns nearby pubs/bars from OpenStreetMap via Overpass.
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lat = parseNumber(params, "lat");
  const lng = parseNumber(params, "lng");
  const radiusRaw = parseNumber(params, "radius");
  const limitRaw = parseNumber(params, "limit");

  if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return Response.json(
      { venues: [], error: "invalid_location" } satisfies OsmVenuesResponse,
      { status: 400 },
    );
  }

  const radiusMeters = Math.min(
    Math.max(radiusRaw ?? DEFAULT_RADIUS_M, 100),
    MAX_RADIUS_M,
  );
  const limit = Math.min(
    Math.max(Math.floor(limitRaw ?? DEFAULT_LIMIT), 1),
    MAX_LIMIT,
  );

  const query = `[out:json][timeout:20];
(
  node["amenity"~"^(pub|bar)$"](around:${radiusMeters},${lat},${lng});
  way["amenity"~"^(pub|bar)$"](around:${radiusMeters},${lat},${lng});
);
out center ${limit};`;

  try {
    const data = await queryOverpass(query);
    const venues: Venue[] = [];
    const seen = new Set<string>();

    for (const element of data.elements ?? []) {
      const venue = toVenue(element);
      if (!venue || seen.has(venue.id)) continue;
      seen.add(venue.id);
      venues.push(venue);
      if (venues.length >= limit) break;
    }

    return Response.json({ venues } satisfies OsmVenuesResponse);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "overpass_unreachable";
    return Response.json(
      { venues: [], error: message } satisfies OsmVenuesResponse,
      { status: 502 },
    );
  }
}
