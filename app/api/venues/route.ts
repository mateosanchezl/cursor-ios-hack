import type { NextRequest } from "next/server";
import type { Venue, VenueKind, VenuesResponse } from "@/lib/types";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

// Guard against runaway queries: refuse bounding boxes larger than this many
// degrees on either axis (~55km of latitude). Clients should zoom in.
const MAX_SPAN_DEG = 0.6;

// Snap the requested box outward to a coarse grid so nearby viewports share a
// cache entry instead of hammering Overpass with slightly-different boxes.
const GRID_DEG = 0.02;

const AMENITIES = ["pub", "bar", "biergarten"] as const;

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function snapDown(value: number) {
  return Math.floor(value / GRID_DEG) * GRID_DEG;
}

function snapUp(value: number) {
  return Math.ceil(value / GRID_DEG) * GRID_DEG;
}

function round(value: number) {
  // Keep the snapped coordinates tidy to stabilise the cache key.
  return Math.round(value * 1e6) / 1e6;
}

function parseCoord(params: URLSearchParams, key: string): number | null {
  const raw = params.get(key);
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function toVenue(el: OverpassElement): Venue | null {
  const lat = el.lat ?? el.center?.lat;
  const lng = el.lon ?? el.center?.lon;
  if (lat == null || lng == null) return null;

  const tags = el.tags ?? {};
  const name = tags.name?.trim();
  if (!name) return null;

  const street = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ")
    .trim();
  const area =
    tags["addr:suburb"] ||
    tags["addr:neighbourhood"] ||
    tags["addr:city"] ||
    street ||
    undefined;

  const amenity = tags.amenity as VenueKind | undefined;

  return {
    id: `${el.type}/${el.id}`,
    name,
    lat,
    lng,
    kind: amenity && AMENITIES.includes(amenity as (typeof AMENITIES)[number])
      ? amenity
      : "venue",
    area,
    address: street || undefined,
    hasTv: tags.tv === "yes" || tags["tv"] === "1" || undefined,
    outdoorSeating: tags.outdoor_seating === "yes" || undefined,
    website: tags.website || tags["contact:website"] || undefined,
  };
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const south = parseCoord(params, "south");
  const west = parseCoord(params, "west");
  const north = parseCoord(params, "north");
  const east = parseCoord(params, "east");

  if (south == null || west == null || north == null || east == null) {
    return Response.json(
      { venues: [], error: "missing_bounds" } satisfies VenuesResponse,
      { status: 400 },
    );
  }

  if (north <= south || east <= west) {
    return Response.json(
      { venues: [], error: "invalid_bounds" } satisfies VenuesResponse,
      { status: 400 },
    );
  }

  if (north - south > MAX_SPAN_DEG || east - west > MAX_SPAN_DEG) {
    return Response.json(
      { venues: [], error: "bounds_too_large" } satisfies VenuesResponse,
      { status: 200 },
    );
  }

  const s = round(snapDown(south));
  const w = round(snapDown(west));
  const n = round(snapUp(north));
  const e = round(snapUp(east));

  const bbox = `${s},${w},${n},${e}`;
  const filter = AMENITIES.map(
    (a) => `nwr["amenity"="${a}"](${bbox});`,
  ).join("");
  const query = `[out:json][timeout:25];(${filter});out center tags 250;`;

  try {
    const res = await fetch(
      `${OVERPASS_ENDPOINT}?data=${encodeURIComponent(query)}`,
      {
        headers: {
          Accept: "application/json",
          // Overpass rejects requests without a User-Agent (HTTP 406).
          "User-Agent": "TribeWatch/1.0 (+https://tribewatch.app)",
        },
        // The World Cup venue landscape barely changes day to day; cache hard.
        next: { revalidate: 86400 },
      },
    );

    if (!res.ok) {
      return Response.json(
        {
          venues: [],
          error: `overpass_${res.status}`,
        } satisfies VenuesResponse,
        { status: 200 },
      );
    }

    const data = (await res.json()) as { elements?: OverpassElement[] };
    const venues: Venue[] = [];
    const seen = new Set<string>();
    for (const el of data.elements ?? []) {
      const venue = toVenue(el);
      if (venue && !seen.has(venue.id)) {
        seen.add(venue.id);
        venues.push(venue);
      }
    }

    return Response.json({ venues } satisfies VenuesResponse, {
      status: 200,
    });
  } catch {
    return Response.json(
      { venues: [], error: "overpass_unreachable" } satisfies VenuesResponse,
      { status: 200 },
    );
  }
}
