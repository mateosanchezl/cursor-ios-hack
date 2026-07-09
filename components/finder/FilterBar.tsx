"use client";

import { ChevronDown, Star, X } from "lucide-react";
import type { Filters, Fixture, Team } from "@/lib/types";
import { VIBES } from "@/lib/vibes";
import { formatKickoff, kickoffRelative } from "@/lib/ranking";
import { awaySide, homeSide } from "@/lib/fixtures";

type FilterBarProps = {
  fixtures: Fixture[];
  teams: Team[];
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
  savedCount: number;
};

function fixtureLabel(fixture: Fixture): string {
  const home = homeSide(fixture);
  const away = awaySide(fixture);
  const homeLabel = home.name.length <= 4 ? home.name : home.code;
  const awayLabel = away.name.length <= 4 ? away.name : away.code;
  return `${home.flag} ${homeLabel} v ${away.flag} ${awayLabel} · ${formatKickoff(
    fixture.kickoff,
  )} (${kickoffRelative(fixture.kickoff)})`;
}

const selectClass =
  "w-full appearance-none rounded-xl border border-white/10 bg-[#0f1a14]/80 px-3 py-2.5 pr-9 text-sm text-[#e8f5e9] outline-none transition focus:border-[#2bb673]/70 focus:ring-1 focus:ring-[#2bb673]/40";

export function FilterBar({
  fixtures,
  teams,
  filters,
  onChange,
  onClear,
  savedCount,
}: FilterBarProps) {
  const hasFilters =
    filters.fixtureId !== null ||
    filters.teamCode !== null ||
    filters.vibe !== null ||
    filters.savedOnly;

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <label className="relative block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8fb39c]">
            Match
          </span>
          <select
            className={selectClass}
            value={filters.fixtureId ?? ""}
            onChange={(event) =>
              onChange({ fixtureId: event.target.value || null })
            }
          >
            <option value="">Any match</option>
            {fixtures.map((fixture) => (
              <option key={fixture.id} value={fixture.id}>
                {fixtureLabel(fixture)}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-[34px] size-4 text-[#8fb39c]"
            aria-hidden
          />
        </label>

        <label className="relative block">
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-[#8fb39c]">
            Your team
          </span>
          <select
            className={selectClass}
            value={filters.teamCode ?? ""}
            onChange={(event) =>
              onChange({ teamCode: event.target.value || null })
            }
          >
            <option value="">Any team</option>
            {teams.map((team) => (
              <option key={team.code} value={team.code}>
                {team.flag} {team.name}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3 top-[34px] size-4 text-[#8fb39c]"
            aria-hidden
          />
        </label>
      </div>

      <div>
        <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-wide text-[#8fb39c]">
          Vibe
        </span>
        <div className="flex flex-wrap gap-2">
          {VIBES.map((vibe) => {
            const active = filters.vibe === vibe.key;
            return (
              <button
                key={vibe.key}
                type="button"
                aria-pressed={active}
                onClick={() =>
                  onChange({ vibe: active ? null : vibe.key })
                }
                className={
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition " +
                  (active
                    ? "border-[#2bb673] bg-[#1f9d57] text-white shadow"
                    : "border-white/10 bg-[#132018]/70 text-[#cfe3d5] hover:border-white/25")
                }
              >
                <span aria-hidden>{vibe.emoji}</span>
                {vibe.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          aria-pressed={filters.savedOnly}
          onClick={() => onChange({ savedOnly: !filters.savedOnly })}
          className={
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition " +
            (filters.savedOnly
              ? "border-[#f5c451] bg-[#f5c451]/15 text-[#f5c451]"
              : "border-white/10 bg-[#132018]/70 text-[#cfe3d5] hover:border-white/25")
          }
        >
          <Star
            className="size-3.5"
            aria-hidden
            fill={filters.savedOnly ? "currentColor" : "none"}
          />
          Saved
          {savedCount > 0 ? (
            <span className="text-xs text-[#9bb5a3]">{savedCount}</span>
          ) : null}
        </button>

        {hasFilters ? (
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs text-[#9bb5a3] transition hover:text-[#e8f5e9]"
          >
            <X className="size-3.5" aria-hidden />
            Clear
          </button>
        ) : null}
      </div>
    </div>
  );
}
