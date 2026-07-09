import type { Team, Venue } from "@/lib/types";

export function normalizedFanBases(venue: Venue): string[] {
  return venue.fanBases.map((fb) => fb.toLowerCase());
}

/** Whether a venue is known to host a crowd for the given team. */
export function venueSupportsTeam(venue: Venue, team: Team): boolean {
  const bases = normalizedFanBases(venue);
  const aliases = [team.name.toLowerCase(), ...(team.aliases ?? [])];
  return aliases.some((alias) => bases.includes(alias));
}

export function isNeutralFriendly(venue: Venue): boolean {
  return normalizedFanBases(venue).includes("neutral");
}
