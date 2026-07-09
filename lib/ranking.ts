import type {
  Busyness,
  Fixture,
  RankedVenue,
  Team,
  UserLocation,
  Venue,
  VibeKey,
} from "@/lib/types";
import { DEFAULT_CAPACITY } from "@/lib/types";
import { getVibe, venueMatchesVibe } from "@/lib/vibes";
import { isNeutralFriendly, venueSupportsTeam } from "@/lib/tribe";
import { busynessFor, estimateGoing } from "@/lib/attendance";

export { venueSupportsTeam } from "@/lib/tribe";

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Great-circle distance between two coordinates, in kilometres. */
export function distanceKm(a: UserLocation, b: UserLocation): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

export type RankInput = {
  venues: Venue[];
  team: Team | null;
  /** The selected fixture, if any (drives crowd estimates). */
  fixture: Fixture | null;
  /** Teams playing in the selected fixture (empty when no fixture chosen). */
  fixtureTeams: Team[];
  vibe: VibeKey | null;
  userLocation: UserLocation | null;
};

function scoreVenue(
  venue: Venue,
  input: RankInput,
): {
  score: number;
  reasons: string[];
  isTribeMatch: boolean;
  going: number | null;
  busyness: Busyness | null;
} {
  const reasons: string[] = [];
  let score = 40;
  let isTribeMatch = false;
  const capacity = venue.capacity ?? DEFAULT_CAPACITY;

  // Team / tribe affinity — the strongest signal.
  if (input.team) {
    if (venueSupportsTeam(venue, input.team)) {
      score += 36;
      isTribeMatch = true;
      reasons.push(`${input.team.flag} ${input.team.name} crowd`);
    } else if (isNeutralFriendly(venue)) {
      score += 8;
      reasons.push("Neutral-friendly");
    } else {
      score -= 6;
    }
  } else if (input.fixtureTeams.length > 0) {
    const supported = input.fixtureTeams.filter((team) =>
      venueSupportsTeam(venue, team),
    );
    if (supported.length > 0) {
      score += 30 + (supported.length - 1) * 6;
      isTribeMatch = true;
      reasons.push(
        supported.map((team) => `${team.flag} ${team.name}`).join(" + "),
      );
    } else if (isNeutralFriendly(venue)) {
      score += 8;
      reasons.push("Neutral-friendly");
    }
  }

  // Vibe fit.
  if (input.vibe) {
    if (venueMatchesVibe(venue, input.vibe)) {
      score += 15;
      const def = getVibe(input.vibe);
      if (def) reasons.push(`${def.emoji} ${def.label}`);
    } else {
      score -= 10;
    }
  }

  // Crowd / social proof for the selected fixture.
  let going: number | null = null;
  let busyness: Busyness | null = null;
  if (input.fixture) {
    going = estimateGoing(venue, input.fixture, input.fixtureTeams);
    busyness = busynessFor(going, capacity);
    score += Math.min(8, (going / capacity) * 8);
    if (busyness === "packed" || busyness === "busy") {
      reasons.push(`🔥 ${going} going`);
    }
  }

  // Screens + capacity make for a better big-match watch.
  if (venue.screens === "large") {
    score += 6;
    reasons.push("Big screens");
  } else if (venue.screens === "medium") {
    score += 3;
  }
  score += Math.min(8, (capacity / 300) * 8);

  // Proximity.
  let distance: number | null = null;
  if (input.userLocation) {
    distance = distanceKm(input.userLocation, venue);
    const proximity = Math.max(0, 16 - distance * 3);
    score += proximity;
  }

  if (venue.bookable) {
    score += 3;
  }

  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    reasons: reasons.slice(0, 3),
    isTribeMatch,
    going,
    busyness,
  };
}

/** Rank venues for the active filters, best first. */
export function rankVenues(input: RankInput): RankedVenue[] {
  const ranked = input.venues.map<RankedVenue>((venue) => {
    const { score, reasons, isTribeMatch, going, busyness } = scoreVenue(
      venue,
      input,
    );
    const distance = input.userLocation
      ? distanceKm(input.userLocation, venue)
      : null;
    return {
      venue,
      score,
      distanceKm: distance,
      reasons,
      isTribeMatch,
      going,
      busyness,
    };
  });

  return ranked.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.distanceKm != null && b.distanceKm != null) {
      return a.distanceKm - b.distanceKm;
    }
    return a.venue.name.localeCompare(b.venue.name);
  });
}

export function formatDistance(distanceKm: number | null): string | null {
  if (distanceKm == null) return null;
  if (distanceKm < 1) return `${Math.round(distanceKm * 1000)} m`;
  return `${distanceKm.toFixed(1)} km`;
}

const KICKOFF_FORMATTER = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  hour: "numeric",
  minute: "2-digit",
});

export function formatKickoff(iso: string): string {
  return KICKOFF_FORMATTER.format(new Date(iso));
}

/** "Live", "in 2h", "in 3 days", or "full-time" style relative label. */
export function kickoffRelative(iso: string, now: Date = new Date()): string {
  const kickoff = new Date(iso);
  const diffMs = kickoff.getTime() - now.getTime();
  const diffMin = Math.round(diffMs / 60000);

  if (diffMin <= -120) return "Full-time";
  if (diffMin <= 0) return "Live now";
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffHours = Math.round(diffMin / 60);
  if (diffHours < 24) return `in ${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  return `in ${diffDays}d`;
}
