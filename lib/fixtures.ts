import type { Fixture, FixtureSide, Team } from "@/lib/types";
import { getTeam } from "@/data/teams";

/** Resolve a fixture participant from a local team code or inline live data. */
export function homeSide(fixture: Fixture): FixtureSide {
  const team = getTeam(fixture.homeCode);
  return {
    code: fixture.homeCode,
    name: team?.name ?? fixture.homeName ?? fixture.homeCode,
    flag: team?.flag ?? fixture.homeFlag ?? "🏳️",
  };
}

export function awaySide(fixture: Fixture): FixtureSide {
  const team = getTeam(fixture.awayCode);
  return {
    code: fixture.awayCode,
    name: team?.name ?? fixture.awayName ?? fixture.awayCode,
    flag: team?.flag ?? fixture.awayFlag ?? "🏳️",
  };
}

/** A Team for ranking, preferring the local table (with aliases) then inline. */
export function teamFromSide(side: FixtureSide): Team {
  return (
    getTeam(side.code) ?? {
      code: side.code,
      name: side.name,
      flag: side.flag,
      aliases: [side.name.toLowerCase()],
    }
  );
}

export function fixtureTeams(fixture: Fixture): Team[] {
  return [teamFromSide(homeSide(fixture)), teamFromSide(awaySide(fixture))];
}
