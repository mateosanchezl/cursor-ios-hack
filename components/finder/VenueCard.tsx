"use client";

import { Check, Crown, Navigation, Star, Tv, Users } from "lucide-react";
import type { RankedVenue } from "@/lib/types";
import { formatDistance } from "@/lib/ranking";
import { busynessColor, busynessLabel } from "@/lib/attendance";

type VenueCardProps = {
  ranked: RankedVenue;
  rank: number;
  selected: boolean;
  isTopPick: boolean;
  filtersActive: boolean;
  isSaved: boolean;
  isGoing: boolean;
  canRsvp: boolean;
  onSelect: () => void;
  onToggleSave: () => void;
  onToggleGoing: () => void;
};

function directionsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

function sourceBadge(source: RankedVenue["venue"]["source"]): string | null {
  if (source === "osm") return "OSM";
  if (source === "user") return "Yours";
  return null;
}

export function VenueCard({
  ranked,
  rank,
  selected,
  isTopPick,
  filtersActive,
  isSaved,
  isGoing,
  canRsvp,
  onSelect,
  onToggleSave,
  onToggleGoing,
}: VenueCardProps) {
  const { venue, score, distanceKm, reasons, going, busyness } = ranked;
  const distance = formatDistance(distanceKm);
  const badge = sourceBadge(venue.source);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onSelect();
        }
      }}
      className={
        "cursor-pointer rounded-2xl border p-3 transition " +
        (selected
          ? "border-[#2bb673] bg-[#16281d] shadow-lg shadow-black/30"
          : "border-white/10 bg-[#0f1a14]/70 hover:border-white/25 hover:bg-[#122019]/80")
      }
    >
      <div className="flex items-start gap-3">
        <div
          className={
            "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold " +
            (isTopPick
              ? "bg-[#f5c451] text-[#1b1400]"
              : "bg-[#1f3d2c] text-[#c8e6c9]")
          }
          aria-hidden
        >
          {isTopPick ? <Crown className="size-4" /> : rank}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate font-[family-name:var(--font-display)] text-[15px] text-[#e8f5e9]">
              {venue.name}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {distance ? (
                <span className="text-xs text-[#8fb39c]">{distance}</span>
              ) : null}
              <button
                type="button"
                aria-label={isSaved ? "Remove from saved" : "Save spot"}
                aria-pressed={isSaved}
                onClick={(event) => {
                  event.stopPropagation();
                  onToggleSave();
                }}
                className={
                  "rounded-full p-1 transition " +
                  (isSaved
                    ? "text-[#f5c451]"
                    : "text-[#5f7d6b] hover:text-[#cfe3d5]")
                }
              >
                <Star
                  className="size-4"
                  fill={isSaved ? "currentColor" : "none"}
                  aria-hidden
                />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <p className="text-xs text-[#8fb39c]">{venue.area}</p>
            {badge ? (
              <span className="rounded bg-[#1c3325] px-1.5 py-0.5 text-[10px] text-[#9bb5a3]">
                {badge}
              </span>
            ) : null}
          </div>

          {reasons.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {reasons.map((reason) => (
                <span
                  key={reason}
                  className="rounded-full bg-[#1c3325] px-2 py-0.5 text-[11px] text-[#cfe3d5]"
                >
                  {reason}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7fa38d]">
            {busyness && going != null ? (
              <span className={"inline-flex items-center gap-1 " + busynessColor(busyness)}>
                <span className="size-1.5 rounded-full bg-current" aria-hidden />
                {busynessLabel(busyness)} · {going} going
              </span>
            ) : venue.capacity ? (
              <span className="inline-flex items-center gap-1">
                <Users className="size-3.5" aria-hidden />
                {venue.capacity}
              </span>
            ) : null}
            <span className="inline-flex items-center gap-1">
              <Tv className="size-3.5" aria-hidden />
              {venue.screens}
            </span>
            {venue.priceLevel ? (
              <span aria-label={`price level ${venue.priceLevel}`}>
                {"£".repeat(venue.priceLevel)}
              </span>
            ) : null}
            <a
              href={directionsHref(venue.lat, venue.lng)}
              target="_blank"
              rel="noreferrer"
              onClick={(event) => event.stopPropagation()}
              className="ml-auto inline-flex items-center gap-1 text-[#7fd8a3] hover:text-[#a8f0c6]"
            >
              <Navigation className="size-3.5" aria-hidden />
              Directions
            </a>
          </div>
        </div>
      </div>

      {(filtersActive || canRsvp) ? (
        <div className="mt-3 flex items-center gap-2">
          {filtersActive ? (
            <>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className={
                    "h-full rounded-full " +
                    (isTopPick ? "bg-[#f5c451]" : "bg-[#2bb673]")
                  }
                  style={{ width: `${score}%` }}
                />
              </div>
              <span className="w-9 text-right text-[11px] tabular-nums text-[#8fb39c]">
                {score}%
              </span>
            </>
          ) : (
            <span className="flex-1" />
          )}
          {canRsvp ? (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onToggleGoing();
              }}
              aria-pressed={isGoing}
              className={
                "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition " +
                (isGoing
                  ? "bg-[#1f9d57] text-white"
                  : "border border-[#2bb673]/50 text-[#7fd8a3] hover:bg-[#12281c]")
              }
            >
              {isGoing ? (
                <>
                  <Check className="size-3.5" aria-hidden /> Going
                </>
              ) : (
                "I'm in"
              )}
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
