import type { Fixture, FixtureStatus } from "@/lib/types";

export const LIVE_STATUSES: ReadonlySet<FixtureStatus> = new Set([
  "IN_PLAY",
  "PAUSED",
]);

export function isLive(fixture: Fixture) {
  return LIVE_STATUSES.has(fixture.status);
}

export function isUpcoming(fixture: Fixture) {
  return fixture.status === "SCHEDULED" || fixture.status === "TIMED";
}

export function isFinished(fixture: Fixture) {
  return fixture.status === "FINISHED";
}

/**
 * Orders fixtures for the ticker: live first, then soonest upcoming, then the
 * most recently finished. Everything else (postponed etc.) sinks to the end.
 */
export function orderForTicker(fixtures: Fixture[]): Fixture[] {
  const rank = (f: Fixture) => {
    if (isLive(f)) return 0;
    if (isUpcoming(f)) return 1;
    if (isFinished(f)) return 2;
    return 3;
  };

  return [...fixtures].sort((a, b) => {
    const byRank = rank(a) - rank(b);
    if (byRank !== 0) return byRank;
    // Within upcoming, soonest first; within finished, most recent first.
    const asc = a.utcDate.localeCompare(b.utcDate);
    return isFinished(a) ? -asc : asc;
  });
}

export function shortTeam(team: { tla?: string; shortName?: string; name: string }) {
  return team.tla || team.shortName || team.name;
}

/** e.g. "Today 20:00", "Sat 15:00", "Live", "FT". */
export function kickoffLabel(fixture: Fixture, now: Date = new Date()): string {
  if (isLive(fixture)) return "Live";
  if (isFinished(fixture)) return "FT";

  const date = new Date(fixture.utcDate);
  if (Number.isNaN(date.getTime())) return "TBD";

  const time = date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });

  const sameDay = date.toDateString() === now.toDateString();
  if (sameDay) return `Today ${time}`;

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (date.toDateString() === tomorrow.toDateString()) return `Tmrw ${time}`;

  const weekday = date.toLocaleDateString(undefined, { weekday: "short" });
  return `${weekday} ${time}`;
}

export function stageLabel(fixture: Fixture): string | null {
  if (!fixture.stage) return null;
  const pretty = fixture.stage
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  return fixture.group ? `${pretty} · ${fixture.group}` : pretty;
}
