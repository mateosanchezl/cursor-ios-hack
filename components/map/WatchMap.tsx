"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Crown, Loader2, Navigation, Plus, Search, Tv, X } from "lucide-react";
import Map, {
  Marker,
  NavigationControl,
  Popup,
  type MapLayerMouseEvent,
  type MapRef,
  type ViewStateChangeEvent,
} from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import { SAMPLE_VENUES } from "@/data/sample-venues";
import { TEAMS, getTeam } from "@/data/teams";
import {
  DEFAULT_ZOOM,
  FALLBACK_LOCATION,
  LOCATED_ZOOM,
  MAP_STYLE,
} from "@/lib/map";
import { formatDistance, kickoffRelative, rankVenues } from "@/lib/ranking";
import { busynessFor } from "@/lib/attendance";
import { awaySide, fixtureTeams, homeSide } from "@/lib/fixtures";
import { planShareUrl } from "@/lib/plan-share";
import { DEFAULT_CAPACITY } from "@/lib/types";
import type {
  Filters,
  Fixture,
  LocationStatus,
  RankedVenue,
  Team,
  UserLocation,
  Venue,
} from "@/lib/types";
import { FinderPanel } from "@/components/finder/FinderPanel";
import { AlertBanner } from "@/components/map/AlertBanner";
import { useFixtures } from "@/hooks/useFixtures";
import { usePlan } from "@/hooks/usePlan";
import { useUserVenues } from "@/hooks/useUserVenues";
import { useOsmVenues } from "@/hooks/useOsmVenues";

type ViewState = {
  longitude: number;
  latitude: number;
  zoom: number;
};

function flyPadding() {
  if (typeof window === "undefined") {
    return { top: 0, bottom: 0, left: 0, right: 0 };
  }
  return window.innerWidth >= 640
    ? { top: 0, bottom: 0, left: 400, right: 0 }
    : { top: 0, bottom: 180, left: 0, right: 0 };
}

function fixtureInvolvesTeam(fixture: Fixture, team: Team): boolean {
  if (fixture.homeCode === team.code || fixture.awayCode === team.code) {
    return true;
  }
  const name = team.name.toLowerCase();
  return (
    homeSide(fixture).name.toLowerCase() === name ||
    awaySide(fixture).name.toLowerCase() === name
  );
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
    savedOnly: false,
  });

  const [addMode, setAddMode] = useState(false);
  const [addDraft, setAddDraft] = useState<UserLocation | null>(null);
  const [shareLabel, setShareLabel] = useState("Share plan");
  const [dismissedAlertId, setDismissedAlertId] = useState<string | null>(null);
  const [notifiedAlertIds, setNotifiedAlertIds] = useState<string[]>([]);
  // Current time, updated off-render so relative labels stay fresh.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = window.setTimeout(tick, 0);
    const interval = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(interval);
    };
  }, []);

  const { fixtures, source: fixturesSource } = useFixtures();
  const {
    isSaved,
    toggleSaved,
    isGoing,
    toggleGoing,
    savedCount,
    rsvpCount,
    plan,
  } = usePlan();
  const { userVenues, addVenue } = useUserVenues();
  const { osmVenues, osmLoading, osmError, searchArea, clearOsm } =
    useOsmVenues();

  const onMapRef = useCallback((ref: MapRef | null) => {
    setMapRef(ref);
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
    if (!userLocation || !mapRef) return;
    mapRef.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: LOCATED_ZOOM,
      duration: 1400,
      padding: flyPadding(),
    });
  }, [userLocation, mapRef]);

  const allVenues = useMemo(() => {
    const seen = new Set<string>();
    const list: Venue[] = [];
    for (const venue of [...SAMPLE_VENUES, ...userVenues, ...osmVenues]) {
      if (seen.has(venue.id)) continue;
      seen.add(venue.id);
      list.push(venue);
    }
    return list;
  }, [userVenues, osmVenues]);

  const selectedFixture = useMemo(
    () => fixtures.find((item) => item.id === filters.fixtureId) ?? null,
    [fixtures, filters.fixtureId],
  );
  const selectedTeam = getTeam(filters.teamCode);
  const teamsInFixture = useMemo(
    () => (selectedFixture ? fixtureTeams(selectedFixture) : []),
    [selectedFixture],
  );

  const ranked = useMemo(
    () =>
      rankVenues({
        venues: allVenues,
        team: selectedTeam,
        fixture: selectedFixture,
        fixtureTeams: teamsInFixture,
        vibe: filters.vibe,
        userLocation,
      }),
    [
      allVenues,
      selectedTeam,
      selectedFixture,
      teamsInFixture,
      filters.vibe,
      userLocation,
    ],
  );

  // Fold the user's own RSVP into the displayed crowd counts.
  const displayRanked = useMemo(() => {
    if (!filters.fixtureId) return ranked;
    const fixtureId = filters.fixtureId;
    return ranked.map((entry) => {
      if (entry.going != null && isGoing(fixtureId, entry.venue.id)) {
        const going = entry.going + 1;
        return {
          ...entry,
          going,
          busyness: busynessFor(going, entry.venue.capacity ?? DEFAULT_CAPACITY),
        };
      }
      return entry;
    });
  }, [ranked, filters.fixtureId, isGoing]);

  const rankByVenueId = useMemo(() => {
    const lookup: Record<string, { entry: RankedVenue; rank: number }> = {};
    displayRanked.forEach((entry, index) => {
      lookup[entry.venue.id] = { entry, rank: index + 1 };
    });
    return lookup;
  }, [displayRanked]);

  const filtersActive =
    filters.fixtureId !== null ||
    filters.teamCode !== null ||
    filters.vibe !== null ||
    filters.savedOnly;

  const topPickId =
    (filters.fixtureId !== null ||
      filters.teamCode !== null ||
      filters.vibe !== null) &&
    displayRanked.length > 0 &&
    (displayRanked[0].isTribeMatch || displayRanked[0].score >= 70)
      ? displayRanked[0].venue.id
      : null;

  const visibleRanked = useMemo(
    () =>
      filters.savedOnly
        ? displayRanked.filter((entry) => isSaved(entry.venue.id))
        : displayRanked,
    [displayRanked, filters.savedOnly, isSaved],
  );

  const handleSelectVenue = useCallback(
    (id: string) => {
      setSelectedVenueId(id);
      const venue = allVenues.find((item) => item.id === id);
      if (venue && mapRef) {
        mapRef.flyTo({
          center: [venue.lng, venue.lat],
          zoom: Math.max(LOCATED_ZOOM, 14.5),
          duration: 1000,
          padding: flyPadding(),
        });
      }
    },
    [allVenues, mapRef],
  );

  const handleFilterChange = useCallback((patch: Partial<Filters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const handleClear = useCallback(() => {
    setFilters({
      fixtureId: null,
      teamCode: null,
      vibe: null,
      savedOnly: false,
    });
  }, []);

  const handleStartAdd = useCallback(() => {
    setAddMode(true);
    setAddDraft({ lat: viewState.latitude, lng: viewState.longitude });
    setSelectedVenueId(null);
  }, [viewState.latitude, viewState.longitude]);

  const handleCancelAdd = useCallback(() => {
    setAddMode(false);
    setAddDraft(null);
  }, []);

  const handleSaveVenue = useCallback(
    (venue: Venue) => {
      addVenue(venue);
      setAddMode(false);
      setAddDraft(null);
      handleSelectVenue(venue.id);
    },
    [addVenue, handleSelectVenue],
  );

  const handleMapClick = useCallback(
    (event: MapLayerMouseEvent) => {
      if (addMode) {
        setAddDraft({ lat: event.lngLat.lat, lng: event.lngLat.lng });
      }
    },
    [addMode],
  );

  const handleSearchArea = useCallback(() => {
    searchArea({ lat: viewState.latitude, lng: viewState.longitude });
  }, [searchArea, viewState.latitude, viewState.longitude]);

  const handleSharePlan = useCallback(async () => {
    const url = planShareUrl(plan);
    if (!url) return;
    try {
      if (navigator.share) {
        await navigator.share({ title: "My TribeWatch match-day plan", url });
        setShareLabel("Shared!");
      } else {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied!");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setShareLabel("Link copied!");
      } catch {
        setShareLabel("Copy failed");
      }
    }
    window.setTimeout(() => setShareLabel("Share plan"), 2500);
  }, [plan]);

  // Upcoming fixture for the selected team → drives the alert banner.
  const upcomingForTeam = useMemo(() => {
    if (!selectedTeam) return null;
    const cutoff = now - 2 * 3600 * 1000;
    return (
      fixtures
        .filter(
          (fixture) =>
            fixtureInvolvesTeam(fixture, selectedTeam) &&
            new Date(fixture.kickoff).getTime() > cutoff,
        )
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff))[0] ?? null
    );
  }, [fixtures, selectedTeam, now]);

  const alertTopVenue = useMemo(
    () => displayRanked.find((entry) => entry.isTribeMatch) ?? displayRanked[0],
    [displayRanked],
  );

  const alertInfo = useMemo(() => {
    if (!upcomingForTeam || !selectedTeam) return null;
    const home = homeSide(upcomingForTeam);
    const away = awaySide(upcomingForTeam);
    const isHome =
      home.code === selectedTeam.code ||
      home.name.toLowerCase() === selectedTeam.name.toLowerCase();
    const opponent = isHome ? away : home;
    const relative = kickoffRelative(upcomingForTeam.kickoff);
    const topName = alertTopVenue?.venue.name;
    const topDistance = alertTopVenue
      ? formatDistance(alertTopVenue.distanceKm)
      : null;
    return {
      headline: `${selectedTeam.flag} ${selectedTeam.name} v ${opponent.flag} ${opponent.name} · ${relative}`,
      detail: topName
        ? `Top spot: ${topName}${topDistance ? ` · ${topDistance}` : ""}`
        : "Pick a spot to watch with your crowd",
      notifyBody: topName ? `Top spot: ${topName}` : "Find your crowd",
      relative,
    };
  }, [upcomingForTeam, selectedTeam, alertTopVenue]);

  const handleNotify = useCallback(
    async (fixtureId: string, headline: string, detail: string) => {
      if (typeof Notification !== "undefined") {
        try {
          let permission = Notification.permission;
          if (permission === "default") {
            permission = await Notification.requestPermission();
          }
          if (permission === "granted") {
            new Notification("TribeWatch", { body: `${headline} — ${detail}` });
          }
        } catch {
          // Ignore — falls back to the in-app banner.
        }
      }
      setNotifiedAlertIds((prev) =>
        prev.includes(fixtureId) ? prev : [...prev, fixtureId],
      );
    },
    [],
  );

  const selectedRanked = selectedVenueId
    ? rankByVenueId[selectedVenueId]?.entry ?? null
    : null;
  const selectedVenue = selectedRanked?.venue ?? null;

  const showAlert =
    !addMode &&
    upcomingForTeam !== null &&
    selectedTeam !== null &&
    dismissedAlertId !== upcomingForTeam.id;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#0b1510]">
      <FinderPanel
        locationStatus={locationStatus}
        fixtures={fixtures}
        teams={TEAMS}
        filters={filters}
        onChange={handleFilterChange}
        onClear={handleClear}
        ranked={visibleRanked}
        selectedVenueId={selectedVenueId}
        topPickId={topPickId}
        onSelectVenue={handleSelectVenue}
        fixturesSource={fixturesSource}
        isSaved={isSaved}
        toggleSaved={toggleSaved}
        isGoing={isGoing}
        toggleGoing={toggleGoing}
        savedCount={savedCount}
        planCount={savedCount + rsvpCount}
        shareLabel={shareLabel}
        onSharePlan={handleSharePlan}
        addMode={addMode}
        addDraft={addDraft}
        onStartAdd={handleStartAdd}
        onCancelAdd={handleCancelAdd}
        onSaveVenue={handleSaveVenue}
      />

      {/* Top overlay: add-mode hint, or alert + area search. */}
      <div className="pointer-events-none absolute left-1/2 top-4 z-20 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 flex-col items-stretch gap-2 sm:left-[calc(50%+192px)]">
        {addMode ? (
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-[#f5c451]/30 bg-[#171207]/95 px-3.5 py-2.5 text-sm text-[#f7e6b8] shadow-2xl backdrop-blur-md">
            <Plus className="size-4 shrink-0" aria-hidden />
            Tap the map to place your spot, then fill in the details.
          </div>
        ) : (
          <>
            {showAlert && upcomingForTeam && alertInfo ? (
              <AlertBanner
                headline={alertInfo.headline}
                detail={alertInfo.detail}
                notified={notifiedAlertIds.includes(upcomingForTeam.id)}
                onNotify={() =>
                  handleNotify(
                    upcomingForTeam.id,
                    alertInfo.headline,
                    alertInfo.notifyBody,
                  )
                }
                onView={() => {
                  handleFilterChange({ fixtureId: upcomingForTeam.id });
                  if (alertTopVenue) handleSelectVenue(alertTopVenue.venue.id);
                }}
                onDismiss={() => setDismissedAlertId(upcomingForTeam.id)}
              />
            ) : null}

            <div className="pointer-events-auto flex items-center gap-2 self-center">
              <button
                type="button"
                onClick={handleSearchArea}
                disabled={osmLoading}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-[#0f1a14]/95 px-3.5 py-2 text-sm text-[#e8f5e9] shadow-xl backdrop-blur-md transition hover:border-white/25 disabled:opacity-70"
              >
                {osmLoading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="size-4" aria-hidden />
                )}
                {osmLoading ? "Searching…" : "Search this area"}
              </button>
              {osmVenues.length > 0 ? (
                <button
                  type="button"
                  onClick={clearOsm}
                  className="inline-flex items-center gap-1 rounded-full border border-white/12 bg-[#0f1a14]/95 px-3 py-2 text-xs text-[#9bb5a3] shadow-xl backdrop-blur-md transition hover:text-[#e8f5e9]"
                >
                  +{osmVenues.length} nearby
                  <X className="size-3.5" aria-hidden />
                </button>
              ) : null}
            </div>
            {osmError ? (
              <p className="pointer-events-auto self-center rounded-full bg-[#2a1414]/90 px-3 py-1 text-xs text-[#f0a9a9] shadow">
                {osmError}
              </p>
            ) : null}
          </>
        )}
      </div>

      <Map
        ref={onMapRef}
        {...viewState}
        onMove={(event: ViewStateChangeEvent) => setViewState(event.viewState)}
        onClick={handleMapClick}
        cursor={addMode ? "crosshair" : undefined}
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

        {addMode && addDraft ? (
          <Marker
            longitude={addDraft.lng}
            latitude={addDraft.lat}
            anchor="bottom"
          >
            <span className="flex size-9 items-center justify-center rounded-full border-2 border-white bg-[#f5c451] text-[#1b1400] shadow-lg">
              <Plus className="size-5" aria-hidden />
            </span>
          </Marker>
        ) : null}

        {allVenues.map((venue) => {
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
                        : venue.source === "user"
                          ? "size-8 border-[#f5c451]/70 bg-[#245e3f]"
                          : venue.source === "osm"
                            ? "size-7 border-white/25 bg-[#14251b]"
                            : "size-8 border-[#8fd6a8]/40 bg-[#1b4d32]") +
                    (isSelected
                      ? " ring-2 ring-white ring-offset-2 ring-offset-[#0b1510]"
                      : "")
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
                Screen {selectedVenue.screens} · {selectedVenue.seating}
                {selectedVenue.priceLevel
                  ? ` · ${"£".repeat(selectedVenue.priceLevel)}`
                  : ""}
              </p>

              <div className="mt-2.5 flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${selectedVenue.lat},${selectedVenue.lng}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[#1f9d57] px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-[#1b8a4c]"
                >
                  <Navigation className="size-3.5" aria-hidden />
                  Directions
                </a>
                {filters.fixtureId ? (
                  <button
                    type="button"
                    onClick={() =>
                      filters.fixtureId &&
                      toggleGoing(filters.fixtureId, selectedVenue.id)
                    }
                    className={
                      "rounded-lg px-2.5 py-1.5 text-xs font-medium transition " +
                      (isGoing(filters.fixtureId, selectedVenue.id)
                        ? "bg-[#123024] text-[#7fd8a3]"
                        : "border border-[#1f9d57]/40 text-[#1f5136] hover:bg-[#e4f3e9]")
                    }
                  >
                    {isGoing(filters.fixtureId, selectedVenue.id)
                      ? "Going ✓"
                      : "I'm in"}
                  </button>
                ) : null}
              </div>
            </div>
          </Popup>
        ) : null}
      </Map>
    </div>
  );
}
