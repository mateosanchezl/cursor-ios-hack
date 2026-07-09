"use client";

import { ChevronDown, X } from "lucide-react";
import type { Filters, Fixture, Team } from "@/lib/types";
import { getTeam } from "@/data/teams";
import { VIBES } from "@/lib/vibes";
import { formatKickoff, kickoffRelative } from "@/lib/ranking";

type FilterBarProps = {
  fixtures: Fixture[];
  teams: Team[];
  filters: Filters;
  onChange: (patch: Partial<Filters>) => void;
  onClear: () => void;
};

function fixtureLabel(fixture: Fixture): string {
  const home = getTeam(fixture.homeCode);
  const away = getTeam(fixture.awayCode);
  return `${home?.flag ?? ""} ${home?.code ?? fixture.homeCode} v ${
    away?.flag ?? ""
  } ${away?.code ?? fixture.awayCode} · ${formatKickoff(fixture.kickoff)} (${kickoffRelative(
    fixture.kickoff,
  )})`;
}

const selectClass =
  "w-full appearance-none rounded-xl border border-white/10 bg-[#0f1a14]/80 px-3 py-2.5 pr-9 text-sm text-[#e8f5e9] outline-none transition focus:border-[#2bb673]/70 focus:ring-1 focus:ring-[#2bb673]/40";

export function FilterBar({
  fixtures,
  teams,
  filters,
  onChange,
  onClear,
}: FilterBarProps) {
  const hasFilters =
    filters.fixtureId !== null ||
    filters.teamCode !== null ||
    filters.vibe !== null;

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

      {hasFilters ? (
        <button
          type="button"
          onClick={onClear}
          className="inline-flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-xs text-[#9bb5a3] transition hover:text-[#e8f5e9]"
        >
          <X className="size-3.5" aria-hidden />
          Clear filters
        </button>
      ) : null}
    </div>
  );
}
