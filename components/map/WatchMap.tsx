"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tv } from "lucide-react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { SAMPLE_VENUES } from "@/data/sample-venues";
import {
  DEFAULT_ZOOM,
  FALLBACK_LOCATION,
  LOCATED_ZOOM,
  MAP_STYLE,
} from "@/lib/map";
import type { LocationStatus, UserLocation, Venue } from "@/lib/types";
import { MapHUD } from "@/components/map/MapHUD";

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

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
  const [mapRef, setMapRef] = useState<MapRef | null>(null);

  const onMapRef = useCallback((ref: MapRef | null) => {
    setMapRef(ref);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const next = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setUserLocation(next);
        setLocationStatus("ready");
      },
      (error) => {
        setLocationStatus(
          error.code === error.PERMISSION_DENIED ? "denied" : "error",
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30_000,
        timeout: 12_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  useEffect(() => {
    if (!userLocation || !mapRef) return;

    mapRef.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: LOCATED_ZOOM,
      duration: 1400,
    });
  }, [userLocation, mapRef]);

  const venues = useMemo(() => SAMPLE_VENUES, []);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b1510]">
      <MapHUD locationStatus={locationStatus} venueCount={venues.length} />

      <Map
        ref={onMapRef}
        {...viewState}
        onMove={(event: ViewStateChangeEvent) => setViewState(event.viewState)}
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
              <span className="rounded-full bg-[#143221] px-2 py-0.5 text-[10px] font-medium text-[#d9f0e0] opacity-0 shadow transition group-hover:opacity-100">
                {venue.area}
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
              <p className="text-xs text-[#4d6b58]">{selectedVenue.area}</p>
              <p className="mt-2 text-xs text-[#2f4a3a]">
                Fans: {selectedVenue.fanBases.join(", ")}
              </p>
              <p className="mt-1 text-xs text-[#2f4a3a]">
                Screen {selectedVenue.screens} · {selectedVenue.seating}
              </p>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
