import type { UserLocation, Venue } from "@/lib/types";

const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

type OverpassResponse = { elements?: OverpassElement[] };

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

/**
 * Fetch real pubs / bars near a point from OpenStreetMap via Overpass.
 * Overpass allows CORS, so this runs directly from the browser — no key needed.
 */
export async function fetchNearbyVenues(
  center: UserLocation,
  radiusMeters = 1500,
  limit = 40,
): Promise<Venue[]> {
  const query = `[out:json][timeout:20];
(
  node["amenity"~"^(pub|bar)$"](around:${radiusMeters},${center.lat},${center.lng});
  way["amenity"~"^(pub|bar)$"](around:${radiusMeters},${center.lat},${center.lng});
);
out center ${limit};`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(OVERPASS_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Overpass ${response.status}`);
    const data = (await response.json()) as OverpassResponse;

    const venues: Venue[] = [];
    for (const element of data.elements ?? []) {
      const tags = element.tags ?? {};
      const name = tags["name"];
      if (!name) continue;

      const lat = element.lat ?? element.center?.lat;
      const lng = element.lon ?? element.center?.lon;
      if (lat == null || lng == null) continue;

      venues.push({
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
      });
    }
    return venues.slice(0, limit);
  } finally {
    clearTimeout(timeout);
  }
}
