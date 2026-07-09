"use client";

import { useMemo } from "react";
import { CalendarOff, Radio } from "lucide-react";
import type { Fixture } from "@/lib/types";
import {
  isFinished,
  isLive,
  kickoffLabel,
  orderForTicker,
  shortTeam,
  stageLabel,
} from "@/lib/fixtures";

type FixturesStripProps = {
  fixtures: Fixture[];
  configured: boolean;
  selectedFixtureId: number | null;
  onSelect: (id: number | null) => void;
};

export function FixturesStrip({
  fixtures,
  configured,
  selectedFixtureId,
  onSelect,
}: FixturesStripProps) {
  const ordered = useMemo(() => orderForTicker(fixtures), [fixtures]);

  if (!configured) {
    return (
      <div className="rounded-2xl border border-amber-400/25 bg-[#20180b]/90 px-4 py-2.5 text-xs text-amber-200/90 shadow-lg backdrop-blur-md">
        Live match schedule isn’t configured yet — add a{" "}
        <code className="rounded bg-black/30 px-1">FOOTBALL_DATA_API_KEY</code>{" "}
        to light up fixtures.
      </div>
    );
  }

  if (ordered.length === 0) {
    return (
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#0f1a14]/90 px-4 py-2.5 text-xs text-[#9bb5a3] shadow-lg backdrop-blur-md">
        <CalendarOff className="size-3.5" aria-hidden />
        No fixtures available right now.
      </div>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {ordered.map((fixture) => {
        const selected = fixture.id === selectedFixtureId;
        const live = isLive(fixture);
        const showScore = live || isFinished(fixture);
        const stage = stageLabel(fixture);

        return (
          <button
            key={fixture.id}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? null : fixture.id)}
            className={`flex shrink-0 flex-col gap-1 rounded-2xl border px-3 py-2 text-left shadow-lg backdrop-blur-md transition ${
              selected
                ? "border-[#2bb673] bg-[#123322]/95"
                : "border-white/10 bg-[#0f1a14]/90 hover:border-white/25"
            }`}
          >
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#9bb5a3]">
              {live ? (
                <span className="inline-flex items-center gap-1 font-semibold text-[#4ade80]">
                  <Radio className="size-3 animate-pulse" aria-hidden />
                  Live
                </span>
              ) : (
                <span>{kickoffLabel(fixture)}</span>
              )}
              {stage ? <span className="truncate">· {stage}</span> : null}
            </div>

            <div className="flex items-center gap-2 text-sm font-medium text-[#e8f5e9]">
              <span>{shortTeam(fixture.home)}</span>
              {showScore ? (
                <span className="tabular-nums text-[#c8e6c9]">
                  {fixture.score.home ?? 0}–{fixture.score.away ?? 0}
                </span>
              ) : (
                <span className="text-[#5f7a68]">v</span>
              )}
              <span>{shortTeam(fixture.away)}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
