"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Plus, Share2 } from "lucide-react";
import type {
  Filters,
  Fixture,
  LocationStatus,
  RankedVenue,
  Team,
  UserLocation,
  Venue,
} from "@/lib/types";
import { getTeam } from "@/data/teams";
import { getVibe } from "@/lib/vibes";
import { formatKickoff, kickoffRelative } from "@/lib/ranking";
import { awaySide, homeSide } from "@/lib/fixtures";
import { FilterBar } from "@/components/finder/FilterBar";
import { VenueCard } from "@/components/finder/VenueCard";
import { AddVenueForm } from "@/components/finder/AddVenueForm";

type FinderPanelProps = {
  locationStatus: LocationStatus;
  fixtures: Fixture[];
  teams: Team[];
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  ranked: RankedVenue[];
  selectedVenueId: string | null;
  topPickId: string | null;
  onSelectVenue: (id: string) => void;
  fixturesSource: "live" | "sample";
  isSaved: (venueId: string) => boolean;
  toggleSaved: (venueId: string) => void;
  isGoing: (fixtureId: string, venueId: string) => boolean;
  toggleGoing: (fixtureId: string, venueId: string) => void;
  savedCount: number;
  planCount: number;
  shareLabel: string;
  onSharePlan: () => void;
  addMode: boolean;
  addDraft: UserLocation | null;
  onStartAdd: () => void;
  onCancelAdd: () => void;
  onSaveVenue: (venue: Venue) => void;
};

function locationLabel(status: LocationStatus): string {
  switch (status) {
    case "locating":
      return "Locating…";
    case "ready":
      return "Near you";
    case "denied":
    case "error":
      return "London";
    default:
      return "Ready";
  }
}

export function FinderPanel({
  locationStatus,
  fixtures,
  teams,
  filters,
  onChange,
  onClear,
  ranked,
  selectedVenueId,
  topPickId,
  onSelectVenue,
  fixturesSource,
  isSaved,
  toggleSaved,
  isGoing,
  toggleGoing,
  savedCount,
  planCount,
  shareLabel,
  onSharePlan,
  addMode,
  addDraft,
  onStartAdd,
  onCancelAdd,
  onSaveVenue,
}: FinderPanelProps) {
  const [expanded, setExpanded] = useState(false);

  const selectedFixture =
    fixtures.find((fixture) => fixture.id === filters.fixtureId) ?? null;
  const selectedTeam = getTeam(filters.teamCode);
  const selectedVibe = getVibe(filters.vibe);

  const filtersActive =
    filters.fixtureId !== null ||
    filters.teamCode !== null ||
    filters.vibe !== null ||
    filters.savedOnly;
  const canRsvp = filters.fixtureId !== null;
  const tribeCount = ranked.filter((entry) => entry.isTribeMatch).length;

  const summaryBits: string[] = [];
  if (selectedTeam) summaryBits.push(`${selectedTeam.flag} ${selectedTeam.name}`);
  if (selectedVibe) summaryBits.push(`${selectedVibe.emoji} ${selectedVibe.label}`);

  const home = selectedFixture ? homeSide(selectedFixture) : null;
  const away = selectedFixture ? awaySide(selectedFixture) : null;

  return (
    <aside className="pointer-events-none absolute inset-x-0 bottom-0 z-10 sm:inset-y-0 sm:right-auto sm:w-[384px]">
      <div className="pointer-events-auto flex max-h-[80dvh] flex-col overflow-hidden rounded-t-3xl border border-white/12 bg-[#0c1611]/95 shadow-2xl backdrop-blur-md sm:h-dvh sm:max-h-none sm:rounded-none sm:rounded-r-3xl sm:border-y-0 sm:border-l-0">
        <header className="shrink-0 border-b border-white/8 px-4 pb-3 pt-4 sm:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[#e8f5e9]">
                TribeWatch
              </p>
              <div className="mt-0.5 flex items-center gap-2">
                <p className="text-sm text-[#a7c4b0]">
                  Find your crowd for the match
                </p>
                <span
                  className="inline-flex items-center gap-1 rounded-full bg-[#132018] px-1.5 py-0.5 text-[10px] text-[#8fb39c]"
                  title={
                    fixturesSource === "live"
                      ? "Live fixtures from provider"
                      : "Sample fixtures (set FOOTBALL_DATA_API_KEY for live)"
                  }
                >
                  <span
                    className={
                      "size-1.5 rounded-full " +
                      (fixturesSource === "live"
                        ? "bg-[#2bb673]"
                        : "bg-[#8fb39c]")
                    }
                    aria-hidden
                  />
                  {fixturesSource === "live" ? "Live" : "Sample"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1f3d2c] px-2.5 py-1 text-xs text-[#c8e6c9]">
                <MapPin className="size-3.5" aria-hidden />
                {locationLabel(locationStatus)}
              </span>
              <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                className="rounded-full bg-[#16281d] p-1.5 text-[#c8e6c9] sm:hidden"
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse finder" : "Expand finder"}
              >
                <ChevronDown
                  className={
                    "size-4 transition-transform " + (expanded ? "" : "rotate-180")
                  }
                  aria-hidden
                />
              </button>
            </div>
          </div>

          {selectedFixture && !addMode ? (
            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-[#2bb673]/25 bg-[#122a1d] px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[#e8f5e9]">
                  {home?.flag} {home?.name}{" "}
                  <span className="text-[#7fa38d]">v</span> {away?.flag}{" "}
                  {away?.name}
                </p>
                <p className="text-[11px] text-[#8fb39c]">
                  {selectedFixture.stage} · {formatKickoff(selectedFixture.kickoff)}
                </p>
              </div>
              <span className="shrink-0 rounded-full bg-[#1f9d57] px-2 py-0.5 text-[11px] font-medium text-white">
                {kickoffRelative(selectedFixture.kickoff)}
              </span>
            </div>
          ) : null}
        </header>

        <div
          className={
            (expanded ? "flex" : "hidden") + " min-h-0 flex-1 flex-col sm:flex"
          }
        >
          {addMode ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
              <AddVenueForm
                draft={addDraft}
                teams={teams}
                onSave={onSaveVenue}
                onCancel={onCancelAdd}
              />
            </div>
          ) : (
            <>
              <div className="shrink-0 space-y-3 border-b border-white/8 px-4 py-3 sm:px-5">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onStartAdd}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#132018]/70 px-3 py-1.5 text-sm text-[#cfe3d5] transition hover:border-white/25"
                  >
                    <Plus className="size-4" aria-hidden />
                    Add a spot
                  </button>
                  <button
                    type="button"
                    onClick={onSharePlan}
                    disabled={planCount === 0}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#132018]/70 px-3 py-1.5 text-sm text-[#cfe3d5] transition hover:border-white/25 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Share2 className="size-4" aria-hidden />
                    {shareLabel}
                    {planCount > 0 ? (
                      <span className="text-xs text-[#9bb5a3]">{planCount}</span>
                    ) : null}
                  </button>
                </div>
                <FilterBar
                  fixtures={fixtures}
                  teams={teams}
                  filters={filters}
                  onChange={onChange}
                  onClear={onClear}
                  savedCount={savedCount}
                />
              </div>

              <div className="flex items-center justify-between px-4 pt-3 text-xs text-[#8fb39c] sm:px-5">
                <span>
                  {ranked.length} spots
                  {filtersActive && tribeCount > 0
                    ? ` · ${tribeCount} for your crowd`
                    : ""}
                </span>
                {summaryBits.length > 0 ? (
                  <span className="truncate pl-2 text-right">
                    {summaryBits.join(" · ")}
                  </span>
                ) : null}
              </div>

              <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto px-4 py-3 sm:px-5">
                {ranked.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-[#8fb39c]">
                    {filters.savedOnly
                      ? "No saved spots yet — tap the ★ on a venue to save it."
                      : "No spots match these filters."}
                  </div>
                ) : (
                  ranked.map((entry, index) => (
                    <VenueCard
                      key={entry.venue.id}
                      ranked={entry}
                      rank={index + 1}
                      selected={selectedVenueId === entry.venue.id}
                      isTopPick={filtersActive && topPickId === entry.venue.id}
                      filtersActive={filtersActive}
                      isSaved={isSaved(entry.venue.id)}
                      isGoing={
                        canRsvp && filters.fixtureId
                          ? isGoing(filters.fixtureId, entry.venue.id)
                          : false
                      }
                      canRsvp={canRsvp}
                      onSelect={() => onSelectVenue(entry.venue.id)}
                      onToggleSave={() => toggleSaved(entry.venue.id)}
                      onToggleGoing={() => {
                        if (filters.fixtureId) {
                          toggleGoing(filters.fixtureId, entry.venue.id);
                        }
                      }}
                    />
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
