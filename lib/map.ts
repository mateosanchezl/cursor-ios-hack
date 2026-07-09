import type { UserLocation } from "@/lib/types";

/** Fallback when geolocation is unavailable — central London. */
export const FALLBACK_LOCATION: UserLocation = {
  lat: 51.5074,
  lng: -0.1278,
};

export const DEFAULT_ZOOM = 13;
export const LOCATED_ZOOM = 14;

/** Free OSM vector basemap — no API key required. */
export const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
