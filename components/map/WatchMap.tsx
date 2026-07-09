"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Navigation, Tv } from "lucide-react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { SAMPLE_VENUES } from "@/data/sample-venues";
import { FIXTURES } from "@/data/fixtures";
import { TEAMS, getTeam } from "@/data/teams";
import {
  DEFAULT_ZOOM,
  FALLBACK_LOCATION,
  LOCATED_ZOOM,
  MAP_STYLE,
} from "@/lib/map";
import { formatDistance, rankVenues } from "@/lib/ranking";
import type {
  Filters,
  LocationStatus,
  RankedVenue,
  UserLocation,
} from "@/lib/types";
import { FinderPanel } from "@/components/finder/FinderPanel";

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

function flyPadding() {
  if (typeof window === "undefined") return { top: 0, bottom: 0, left: 0, right: 0 };
  return window.innerWidth >= 640
    ? { top: 0, bottom: 0, left: 400, right: 0 }
    : { top: 0, bottom: 180, left: 0, right: 0 };
}

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
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [mapRef, setMapRef] = useState<MapRef | null>(null);
  const [filters, setFilters] = useState<Filters>({
    fixtureId: null,
    teamCode: null,
    vibe: null,
  });

  const onMapRef = useCallback((ref: MapRef | null) => {
    setMapRef(ref);
  }, []);

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      return;
    }

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
    if (!userLocation || !mapRef) return;

    mapRef.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: LOCATED_ZOOM,
      duration: 1400,
      padding: flyPadding(),
    });
  }, [userLocation, mapRef]);

  const venues = useMemo(() => SAMPLE_VENUES, []);

  const fixtureTeams = useMemo(() => {
    const fixture = FIXTURES.find((item) => item.id === filters.fixtureId);
    if (!fixture) return [];
    return [getTeam(fixture.homeCode), getTeam(fixture.awayCode)].filter(
      (team): team is NonNullable<typeof team> => team !== null,
    );
  }, [filters.fixtureId]);

  const selectedTeam = getTeam(filters.teamCode);

  const ranked = useMemo(
    () =>
      rankVenues({
        venues,
        team: selectedTeam,
        fixtureTeams,
        vibe: filters.vibe,
        userLocation,
      }),
    [venues, selectedTeam, fixtureTeams, filters.vibe, userLocation],
  );

  const rankByVenueId = useMemo(() => {
    const lookup: Record<string, { entry: RankedVenue; rank: number }> = {};
    ranked.forEach((entry, index) => {
      lookup[entry.venue.id] = { entry, rank: index + 1 };
    });
    return lookup;
  }, [ranked]);

  const filtersActive =
    filters.fixtureId !== null ||
    filters.teamCode !== null ||
    filters.vibe !== null;

  const topPickId =
    filtersActive &&
    ranked.length > 0 &&
    (ranked[0].isTribeMatch || ranked[0].score >= 70)
      ? ranked[0].venue.id
      : null;

  const handleSelectVenue = useCallback(
    (id: string) => {
      setSelectedVenueId(id);
      const venue = SAMPLE_VENUES.find((item) => item.id === id);
      if (venue && mapRef) {
        mapRef.flyTo({
          center: [venue.lng, venue.lat],
          zoom: Math.max(LOCATED_ZOOM, 14.5),
          duration: 1000,
          padding: flyPadding(),
        });
      }
    },
    [mapRef],
  );

  const handleFilterChange = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({ fixtureId: null, teamCode: null, vibe: null });
  }, []);

  const selectedRanked = selectedVenueId
    ? rankByVenueId[selectedVenueId]?.entry ?? null
    : null;
  const selectedVenue = selectedRanked?.venue ?? null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b1510]">
      <FinderPanel
        locationStatus={locationStatus}
        fixtures={FIXTURES}
        teams={TEAMS}
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
        ranked={ranked}
        selectedVenueId={selectedVenueId}
        topPickId={topPickId}
        onSelectVenue={handleSelectVenue}
      />

      <Map
        ref={onMapRef}
        {...viewState}
        onMove={(event: ViewStateChangeEvent) => setViewState(event.viewState)}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={{ compact: true }}
      >
        <NavigationControl position="top-right" showCompass={false} />

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

        {venues.map((venue) => {
          const info = rankByVenueId[venue.id];
          const isTribe = info?.entry.isTribeMatch ?? false;
          const isSelected = selectedVenueId === venue.id;
          const isTopPick = topPickId === venue.id;
          const dimmed = filtersActive && !isTribe && !isSelected && !isTopPick;

          return (
            <Marker
              key={venue.id}
              longitude={venue.lng}
              latitude={venue.lat}
              anchor="bottom"
              onClick={(event) => {
                event.originalEvent.stopPropagation();
                handleSelectVenue(venue.id);
              }}
            >
              <button
                type="button"
                className="group flex flex-col items-center"
                aria-label={venue.name}
                style={{ opacity: dimmed ? 0.4 : 1 }}
              >
                <span className="rounded-full bg-[#143221] px-2 py-0.5 text-[10px] font-medium text-[#d9f0e0] opacity-0 shadow transition group-hover:opacity-100">
                  {venue.area}
                </span>
                <span
                  className={
                    "mt-1 flex items-center justify-center rounded-full border text-white shadow-lg shadow-black/30 transition group-hover:scale-110 " +
                    (isTopPick
                      ? "size-9 border-white/70 bg-[#f5c451] text-[#1b1400]"
                      : isTribe
                        ? "size-8 border-[#8fd6a8]/60 bg-[#1f9d57]"
                        : "size-8 border-[#8fd6a8]/40 bg-[#1b4d32]") +
                    (isSelected ? " ring-2 ring-white ring-offset-2 ring-offset-[#0b1510]" : "")
                  }
                >
                  {isTopPick ? (
                    <Crown className="size-4" aria-hidden />
                  ) : (
                    <Tv className="size-3.5" aria-hidden />
                  )}
                </span>
              </button>
            </Marker>
          );
        })}

        {selectedVenue ? (
          <Popup
            longitude={selectedVenue.lng}
            latitude={selectedVenue.lat}
            anchor="top"
            offset={18}
            onClose={() => setSelectedVenueId(null)}
            closeOnClick={false}
            className="tribewatch-popup"
          >
            <div className="min-w-52 p-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-[family-name:var(--font-display)] text-base text-[#102218]">
                  {selectedVenue.name}
                </p>
                {selectedRanked?.distanceKm != null ? (
                  <span className="text-xs text-[#4d6b58]">
                    {formatDistance(selectedRanked.distanceKm)}
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-[#4d6b58]">{selectedVenue.area}</p>

              {selectedRanked && selectedRanked.reasons.length > 0 ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {selectedRanked.reasons.map((reason) => (
                    <span
                      key={reason}
                      className="rounded-full bg-[#e4f3e9] px-2 py-0.5 text-[11px] text-[#1f5136]"
                    >
                      {reason}
                    </span>
                  ))}
                </div>
              ) : null}

              <p className="mt-2 text-xs text-[#2f4a3a]">
                Fans: {selectedVenue.fanBases.join(", ")}
              </p>
              <p className="mt-1 text-xs text-[#2f4a3a]">
                Screen {selectedVenue.screens} · {selectedVenue.seating} ·{" "}
                {"£".repeat(selectedVenue.priceLevel)}
              </p>

              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.lat},${selectedVenue.lng}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-[#1f9d57] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#1b8a4c]"
              >
                <Navigation className="size-3.5" aria-hidden />
                Directions
              </a>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
