"use client";

import type { ReactNode } from "react";
import { Loader2, MapPin, Users } from "lucide-react";
import type { LocationStatus } from "@/lib/types";
import type { VenuesStatus } from "@/components/map/WatchMap";

type MapHUDProps = {
  locationStatus: LocationStatus;
  venueCount: number;
  venuesStatus: VenuesStatus;
  children?: ReactNode;
};

function statusLabel(status: LocationStatus) {
  switch (status) {
    case "locating":
      return "Finding your location…";
    case "ready":
      return "Centered on you";
    case "denied":
      return "Location blocked — showing London";
    case "error":
      return "Location unavailable — showing London";
    default:
      return "Ready when you are";
  }
}

function venuesLabel(status: VenuesStatus, count: number) {
  switch (status) {
    case "loading":
      return "Finding venues…";
    case "zoom-in":
      return "Zoom in to find venues";
    case "error":
      return "Couldn’t load venues";
    case "ready":
      return `${count} venue${count === 1 ? "" : "s"} nearby`;
    default:
      return `${count} venue${count === 1 ? "" : "s"} nearby`;
  }
}

export function MapHUD({
  locationStatus,
  venueCount,
  venuesStatus,
  children,
}: MapHUDProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-4 sm:p-5">
      <div className="pointer-events-auto mx-auto flex max-w-3xl flex-col gap-3">
        <header className="rounded-2xl border border-white/15 bg-[#0f1a14]/92 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[#e8f5e9]">
                TribeWatch
              </p>
              <p className="mt-0.5 text-sm text-[#a7c4b0]">
                Find your crowd for the match
              </p>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-[#1f3d2c] px-3 py-1 text-xs text-[#c8e6c9]">
              <MapPin className="size-3.5" aria-hidden />
              <span>{statusLabel(locationStatus)}</span>
            </div>
          </div>

          <div className="mt-2 flex items-center gap-2 text-xs text-[#9bb5a3]">
            {venuesStatus === "loading" ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden />
            ) : (
              <Users className="size-3.5" aria-hidden />
            )}
            <span>{venuesLabel(venuesStatus, venueCount)}</span>
          </div>
        </header>

        {children}
      </div>
    </div>
  );
}
