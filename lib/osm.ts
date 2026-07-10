import type { UserLocation, Venue } from "@/lib/types";

export type OsmVenuesResponse = {
  venues: Venue[];
  error?: string;
};

/**
 * Fetch real pubs / bars near a point from OpenStreetMap.
 * Goes through `/api/osm` so Overpass gets a proper User-Agent — calling
 * Overpass directly from the browser returns HTTP 406.
 */
export async function fetchNearbyVenues(
  center: UserLocation,
  radiusMeters = 1500,
  limit = 40,
): Promise<Venue[]> {
  const params = new URLSearchParams({
    lat: String(center.lat),
    lng: String(center.lng),
    radius: String(radiusMeters),
    limit: String(limit),
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25_000);

  try {
    const response = await fetch(`/api/osm?${params}`, {
      signal: controller.signal,
    });
    const data = (await response.json()) as OsmVenuesResponse;
    if (!response.ok) {
      throw new Error(data.error ?? `osm_${response.status}`);
    }
    return data.venues ?? [];
  } finally {
    clearTimeout(timeout);
  }
}
