"use client";

import { useState } from "react";
import { MapPin, X } from "lucide-react";
import type { Team, UserLocation, Venue, VibeKey } from "@/lib/types";
import { getTeam } from "@/data/teams";
import { VIBES } from "@/lib/vibes";

type AddVenueFormProps = {
  draft: UserLocation | null;
  teams: Team[];
  onSave: (venue: Venue) => void;
  onCancel: () => void;
};

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#0f1a14]/80 px-3 py-2.5 text-sm text-[#e8f5e9] outline-none transition placeholder:text-[#5f7d6b] focus:border-[#2bb673]/70 focus:ring-1 focus:ring-[#2bb673]/40";

export function AddVenueForm({
  draft,
  teams,
  onSave,
  onCancel,
}: AddVenueFormProps) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [teamCode, setTeamCode] = useState("");
  const [vibe, setVibe] = useState<VibeKey>("rowdy");

  function handleSave() {
    if (!draft) return;
    const team = getTeam(teamCode);
    const venue: Venue = {
      id: `user-${Date.now()}`,
      name: name.trim() || "My spot",
      lat: draft.lat,
      lng: draft.lng,
      area: area.trim() || "Custom",
      fanBases: team ? [team.name] : ["neutral"],
      screens: "medium",
      seating: "mixed",
      vibes: [vibe],
      capacity: 120,
      priceLevel: 2,
      bookable: false,
      source: "user",
    };
    onSave(venue);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="font-[family-name:var(--font-display)] text-base text-[#e8f5e9]">
          Add a spot
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full p-1 text-[#9bb5a3] hover:text-[#e8f5e9]"
          aria-label="Cancel"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <div
        className={
          "flex items-center gap-2 rounded-xl border px-3 py-2 text-sm " +
          (draft
            ? "border-[#2bb673]/30 bg-[#122a1d] text-[#cfe3d5]"
            : "border-white/10 bg-[#132018]/70 text-[#8fb39c]")
        }
      >
        <MapPin className="size-4 shrink-0" aria-hidden />
        {draft
          ? `Pinned at ${draft.lat.toFixed(4)}, ${draft.lng.toFixed(4)}`
          : "Tap the map to drop your pin"}
      </div>

      <input
        className={inputClass}
        placeholder="Venue name"
        value={name}
        onChange={(event) => setName(event.target.value)}
      />
      <input
        className={inputClass}
        placeholder="Area (e.g. Peckham)"
        value={area}
        onChange={(event) => setArea(event.target.value)}
      />
      <select
        className={inputClass}
        value={teamCode}
        onChange={(event) => setTeamCode(event.target.value)}
      >
        <option value="">Crowd: mixed / neutral</option>
        {teams.map((team) => (
          <option key={team.code} value={team.code}>
            {team.flag} {team.name} crowd
          </option>
        ))}
      </select>

      <div className="flex flex-wrap gap-2">
        {VIBES.map((option) => {
          const active = vibe === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => setVibe(option.key)}
              className={
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition " +
                (active
                  ? "border-[#2bb673] bg-[#1f9d57] text-white"
                  : "border-white/10 bg-[#132018]/70 text-[#cfe3d5] hover:border-white/25")
              }
            >
              <span aria-hidden>{option.emoji}</span>
              {option.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!draft}
          className="flex-1 rounded-xl bg-[#1f9d57] px-3 py-2.5 text-sm font-medium text-white transition hover:bg-[#1b8a4c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save spot
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-white/10 px-3 py-2.5 text-sm text-[#cfe3d5] transition hover:border-white/25"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
