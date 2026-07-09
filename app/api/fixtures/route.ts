import type { Fixture, FixtureStage } from "@/lib/types";
import { flagFromCountryName } from "@/lib/flags";

// External fetch is dynamic; cache the upstream call for 30 minutes.
export const revalidate = 1800;

type FootballDataMatch = {
  id: number;
  utcDate: string;
  stage: string;
  homeTeam: { name?: string | null };
  awayTeam: { name?: string | null };
  area?: { name?: string };
};

const STAGE_MAP: Record<string, FixtureStage> = {
  GROUP_STAGE: "Group",
  LAST_16: "Round of 16",
  QUARTER_FINALS: "Quarter-final",
  SEMI_FINALS: "Semi-final",
  FINAL: "Final",
};

function toFixture(match: FootballDataMatch): Fixture | null {
  const homeName = match.homeTeam?.name ?? "";
  const awayName = match.awayTeam?.name ?? "";
  if (!homeName || !awayName) return null;

  return {
    id: `fd-${match.id}`,
    homeCode: homeName,
    awayCode: awayName,
    homeName,
    awayName,
    homeFlag: flagFromCountryName(homeName),
    awayFlag: flagFromCountryName(awayName),
    kickoff: match.utcDate,
    stage: STAGE_MAP[match.stage] ?? "Group",
    hostCity: match.area?.name ?? "",
  };
}

/**
 * Returns live World Cup fixtures when `FOOTBALL_DATA_API_KEY` is configured,
 * otherwise signals the client to use its bundled sample schedule.
 */
export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return Response.json({ fixtures: [], source: "sample" });
  }

  try {
    const response = await fetch(
      "https://api.football-data.org/v4/competitions/WC/matches?status=SCHEDULED",
      {
        headers: { "X-Auth-Token": apiKey },
        next: { revalidate },
      },
    );
    if (!response.ok) {
      return Response.json({ fixtures: [], source: "sample" });
    }

    const data = (await response.json()) as { matches?: FootballDataMatch[] };
    const fixtures = (data.matches ?? [])
      .map(toFixture)
      .filter((fixture): fixture is Fixture => fixture !== null)
      .sort((a, b) => a.kickoff.localeCompare(b.kickoff))
      .slice(0, 16);

    if (fixtures.length === 0) {
      return Response.json({ fixtures: [], source: "sample" });
    }
    return Response.json({ fixtures, source: "live" });
  } catch {
    return Response.json({ fixtures: [], source: "sample" });
  }
}
