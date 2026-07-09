"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Tv } from "lucide-react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  DEFAULT_ZOOM,
  FALLBACK_LOCATION,
  LOCATED_ZOOM,
  MAP_STYLE,
  MIN_VENUE_ZOOM,
} from "@/lib/map";
import type {
  Fixture,
  LocationStatus,
  UserLocation,
  Venue,
  VenuesResponse,
  FixturesResponse,
} from "@/lib/types";
import { MapHUD } from "@/components/map/MapHUD";
import { FixturesStrip } from "@/components/match/FixturesStrip";

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

type BoundsLike = {
  getSouth: () => number;
  getWest: () => number;
  getNorth: () => number;
  getEast: () => number;
};

type MapLike = {
  getBounds: () => BoundsLike;
  getZoom: () => number;
  getCenter: () => { lng: number; lat: number };
};

export type VenuesStatus = "idle" | "loading" | "ready" | "zoom-in" | "error";

// Refetch gating thresholds, tuned for a Google-Maps-like feel: don't refetch
// on small nudges — only once the map has moved a meaningful fraction of the
// viewport, zoomed about a notch, or the cached results have gone stale.
const VENUE_MOVE_FRACTION = 0.35;
const VENUE_ZOOM_DELTA = 0.75;
const VENUE_REFRESH_MS = 3 * 60 * 1000;
// Debounce so we evaluate only after a pan/zoom gesture settles.
const VENUE_SETTLE_MS = 500;

export default function WatchMap() {
  const [viewState, setViewState] = useState<ViewState>({
    longitude: FALLBACK_LOCATION.lng,
    latitude: FALLBACK_LOCATION.lat,
    zoom: DEFAULT_ZOOM,
  });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>(() =>
    typeof navigator !== "undefined" && "geolocation" in navigator
      ? "locating"
      : "error",
  );
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [venuesStatus, setVenuesStatus] = useState<VenuesStatus>("idle");

  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [fixturesConfigured, setFixturesConfigured] = useState(true);
  const [selectedFixtureId, setSelectedFixtureId] = useState<number | null>(
    null,
  );

  const mapRef = useRef<MapRef | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastFetchRef = useRef<{
    lng: number;
    lat: number;
    zoom: number;
    time: number;
  } | null>(null);

  const loadVenues = useCallback(async (map: MapLike, force = false) => {
    const zoom = map.getZoom();
    if (zoom < MIN_VENUE_ZOOM) {
      setVenues([]);
      setVenuesStatus("zoom-in");
      lastFetchRef.current = null;
      return;
    }

    const bounds = map.getBounds();
    const south = bounds.getSouth();
    const west = bounds.getWest();
    const north = bounds.getNorth();
    const east = bounds.getEast();
    const center = map.getCenter();

    // Decide whether this movement actually warrants a refetch.
    const last = lastFetchRef.current;
    if (!force && last) {
      const spanLat = north - south || 1;
      const spanLng = east - west || 1;
      const movedFraction = Math.max(
        Math.abs(center.lat - last.lat) / spanLat,
        Math.abs(center.lng - last.lng) / spanLng,
      );
      const zoomChange = Math.abs(zoom - last.zoom);
      const stale = Date.now() - last.time > VENUE_REFRESH_MS;
      if (
        movedFraction < VENUE_MOVE_FRACTION &&
        zoomChange < VENUE_ZOOM_DELTA &&
        !stale
      ) {
        return;
      }
    }

    const query = new URLSearchParams({
      south: String(south),
      west: String(west),
      north: String(north),
      east: String(east),
    });

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setVenuesStatus("loading");

    try {
      const res = await fetch(`/api/venues?${query}`, {
        signal: controller.signal,
      });
      const data = (await res.json()) as VenuesResponse;

      if (data.error === "bounds_too_large") {
        setVenues([]);
        setVenuesStatus("zoom-in");
        return;
      }
      if (data.error) {
        setVenuesStatus("error");
        return;
      }

      setVenues(data.venues);
      setVenuesStatus("ready");
      lastFetchRef.current = {
        lng: center.lng,
        lat: center.lat,
        zoom,
        time: Date.now(),
      };
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setVenuesStatus("error");
      }
    }
  }, []);

  const scheduleLoad = useCallback(
    (map: MapLike) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(
        () => loadVenues(map),
        VENUE_SETTLE_MS,
      );
    },
    [loadVenues],
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/fixtures");
        const data = (await res.json()) as FixturesResponse;
        if (cancelled) return;
        setFixturesConfigured(data.configured);
        setFixtures(data.fixtures);
      } catch {
        if (!cancelled) setFixtures([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus("ready");
      },
      (error) => {
        setLocationStatus(
          error.code === error.PERMISSION_DENIED ? "denied" : "error",
        );
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!userLocation || !map) return;

    map.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: LOCATED_ZOOM,
      duration: 1400,
    });
  }, [userLocation]);

  // Longer-interval refresh: keep results current even when the map sits still.
  useEffect(() => {
    const interval = setInterval(() => {
      const map = mapRef.current;
      if (map) loadVenues(map as unknown as MapLike, true);
    }, VENUE_REFRESH_MS);
    return () => clearInterval(interval);
  }, [loadVenues]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b1510]">
      <MapHUD
        locationStatus={locationStatus}
        venueCount={venues.length}
        venuesStatus={venuesStatus}
      >
        <FixturesStrip
          fixtures={fixtures}
          configured={fixturesConfigured}
          selectedFixtureId={selectedFixtureId}
          onSelect={setSelectedFixtureId}
        />
      </MapHUD>

      <Map
        ref={mapRef}
        {...viewState}
        onMove={(event: ViewStateChangeEvent) => setViewState(event.viewState)}
        onLoad={(event) => scheduleLoad(event.target as unknown as MapLike)}
        onMoveEnd={(event) => scheduleLoad(event.target as unknown as MapLike)}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="bottom-right" showCompass={false} />

        {userLocation ? (
          <Marker
            longitude={userLocation.lng}
            latitude={userLocation.lat}
            anchor="center"
          >
            <div className="relative flex size-5 items-center justify-center">
              <span className="absolute inset-0 animate-ping rounded-full bg-[#2bb673]/45" />
              <span className="relative size-3.5 rounded-full border-2 border-white bg-[#1f9d57] shadow" />
              <span className="sr-only">You are here</span>
            </div>
          </Marker>
        ) : null}

        {venues.map((venue) => (
          <Marker
            key={venue.id}
            longitude={venue.lng}
            latitude={venue.lat}
            anchor="bottom"
            onClick={(event) => {
              event.originalEvent.stopPropagation();
              setSelectedVenue(venue);
            }}
          >
            <button
              type="button"
              className="group flex flex-col items-center"
              aria-label={venue.name}
            >
              <span className="max-w-32 truncate rounded-full bg-[#143221] px-2 py-0.5 text-[10px] font-medium text-[#d9f0e0] opacity-0 shadow transition group-hover:opacity-100">
                {venue.name}
              </span>
              <span className="mt-1 flex size-8 items-center justify-center rounded-full border border-[#8fd6a8]/40 bg-[#1b4d32] text-white shadow-lg shadow-black/30 transition group-hover:scale-110">
                <Tv className="size-3.5" aria-hidden />
              </span>
            </button>
          </Marker>
        ))}

        {selectedVenue ? (
          <Popup
            longitude={selectedVenue.lng}
            latitude={selectedVenue.lat}
            anchor="top"
            offset={16}
            onClose={() => setSelectedVenue(null)}
            closeOnClick={false}
            className="tribewatch-popup"
          >
            <div className="min-w-48 p-1">
              <p className="font-[family-name:var(--font-display)] text-base text-[#102218]">
                {selectedVenue.name}
              </p>
              <p className="text-xs capitalize text-[#4d6b58]">
                {selectedVenue.kind}
                {selectedVenue.area ? ` · ${selectedVenue.area}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {selectedVenue.hasTv ? (
                  <span className="rounded-full bg-[#e3f2e8] px-2 py-0.5 text-[10px] text-[#1b4d32]">
                    Has TV
                  </span>
                ) : null}
                {selectedVenue.outdoorSeating ? (
                  <span className="rounded-full bg-[#e3f2e8] px-2 py-0.5 text-[10px] text-[#1b4d32]">
                    Outdoor seating
                  </span>
                ) : null}
              </div>
              {selectedVenue.website ? (
                <a
                  href={selectedVenue.website}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-medium text-[#1f9d57] underline"
                >
                  Visit website
                </a>
              ) : null}
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
