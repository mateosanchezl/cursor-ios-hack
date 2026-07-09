"use client";

import { Crown, Navigation, Tv, Users } from "lucide-react";
import type { RankedVenue } from "@/lib/types";
import { formatDistance } from "@/lib/ranking";

type VenueCardProps = {
  ranked: RankedVenue;
  rank: number;
  selected: boolean;
  isTopPick: boolean;
  filtersActive: boolean;
  onSelect: () => void;
};

function directionsHref(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

export function VenueCard({
  ranked,
  rank,
  selected,
  isTopPick,
  filtersActive,
  onSelect,
}: VenueCardProps) {
  const { venue, score, distanceKm, reasons } = ranked;
  const distance = formatDistance(distanceKm);

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
            {distance ? (
              <span className="shrink-0 text-xs text-[#8fb39c]">{distance}</span>
            ) : null}
          </div>
          <p className="text-xs text-[#8fb39c]">{venue.area}</p>

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

          <div className="mt-2.5 flex items-center gap-3 text-[11px] text-[#7fa38d]">
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" aria-hidden />
              {venue.capacity}
            </span>
            <span className="inline-flex items-center gap-1">
              <Tv className="size-3.5" aria-hidden />
              {venue.screens}
            </span>
            <span aria-label={`price level ${venue.priceLevel}`}>
              {"£".repeat(venue.priceLevel)}
            </span>
            {venue.bookable ? (
              <span className="rounded bg-[#123024] px-1.5 py-0.5 text-[10px] text-[#7fd8a3]">
                Bookable
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

      {filtersActive ? (
        <div className="mt-3 flex items-center gap-2">
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
        </div>
      ) : null}
    </div>
  );
}
