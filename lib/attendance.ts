import type { Busyness, Fixture, Team, Venue } from "@/lib/types";
import { DEFAULT_CAPACITY } from "@/lib/types";
import { isNeutralFriendly, venueSupportsTeam } from "@/lib/tribe";

/** Deterministic 0–1 value from a string, so counts are stable per session. */
function hash01(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

/**
 * Estimated fans heading to a venue for a fixture. Tribe venues, big screens
 * and latter stages fill up more. Deterministic so the demo stays consistent.
 */
export function estimateGoing(
  venue: Venue,
  fixture: Fixture,
  fixtureTeams: Team[],
): number {
  const capacity = venue.capacity ?? DEFAULT_CAPACITY;
  const supports = fixtureTeams.filter((team) =>
    venueSupportsTeam(venue, team),
  ).length;

  let fill = 0.22 + hash01(`${venue.id}:${fixture.id}`) * 0.33;
  if (supports === 1) fill += 0.2;
  if (supports >= 2) fill += 0.34;
  else if (isNeutralFriendly(venue)) fill += 0.06;
  if (venue.screens === "large") fill += 0.08;
  if (fixture.stage === "Final") fill += 0.14;
  else if (fixture.stage === "Semi-final") fill += 0.08;

  fill = Math.max(0.05, Math.min(0.98, fill));
  return Math.round(capacity * fill);
}

export function busynessFor(going: number, capacity: number): Busyness {
  const ratio = capacity > 0 ? going / capacity : 0;
  if (ratio >= 0.85) return "packed";
  if (ratio >= 0.6) return "busy";
  if (ratio >= 0.35) return "filling";
  return "quiet";
}

export function busynessLabel(busyness: Busyness): string {
  switch (busyness) {
    case "packed":
      return "Packed";
    case "busy":
      return "Busy";
    case "filling":
      return "Filling up";
    default:
      return "Quiet";
  }
}

/** Tailwind text colour for a busyness level. */
export function busynessColor(busyness: Busyness): string {
  switch (busyness) {
    case "packed":
      return "text-[#ff9d6b]";
    case "busy":
      return "text-[#f5c451]";
    case "filling":
      return "text-[#7fd8a3]";
    default:
      return "text-[#8fb39c]";
  }
}
