"use client";

import { MapPin, Radio, Users } from "lucide-react";
import type { LocationStatus } from "@/lib/types";

type MapHUDProps = {
  locationStatus: LocationStatus;
  venueCount: number;
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

export function MapHUD({ locationStatus, venueCount }: MapHUDProps) {
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
        </header>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled
            className="rounded-full border border-white/10 bg-[#132018]/85 px-3.5 py-1.5 text-sm text-[#d7e8db] opacity-70 backdrop-blur-md"
          >
            Match
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#132018]/85 px-3.5 py-1.5 text-sm text-[#d7e8db] opacity-70 backdrop-blur-md"
          >
            <Users className="size-3.5" aria-hidden />
            Your team
          </button>
          <button
            type="button"
            disabled
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#132018]/85 px-3.5 py-1.5 text-sm text-[#d7e8db] opacity-70 backdrop-blur-md"
          >
            <Radio className="size-3.5" aria-hidden />
            Vibe
          </button>
          <span className="ml-auto self-center text-xs text-[#9bb5a3]">
            {venueCount} sample spots
          </span>
        </div>
      </div>
    </div>
  );
}
