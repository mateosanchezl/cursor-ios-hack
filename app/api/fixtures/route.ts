import type {
  Fixture,
  FixtureStatus,
  FixtureTeam,
  FixturesResponse,
} from "@/lib/types";

const API_BASE = "https://api.football-data.org/v4";
// football-data.org competition code for the FIFA World Cup.
const COMPETITION = "WC";

type UpstreamTeam = {
  name?: string;
  shortName?: string;
  tla?: string;
  crest?: string;
};

type UpstreamMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage?: string;
  group?: string | null;
  homeTeam?: UpstreamTeam;
  awayTeam?: UpstreamTeam;
  score?: { fullTime?: { home?: number | null; away?: number | null } };
};

function toTeam(team: UpstreamTeam | undefined): FixtureTeam {
  return {
    name: team?.name ?? "TBD",
    shortName: team?.shortName,
    tla: team?.tla,
    crest: team?.crest,
  };
}

function toFixture(match: UpstreamMatch): Fixture {
  return {
    id: match.id,
    utcDate: match.utcDate,
    status: (match.status as FixtureStatus) ?? "SCHEDULED",
    stage: match.stage,
    group: match.group ?? null,
    home: toTeam(match.homeTeam),
    away: toTeam(match.awayTeam),
    score: {
      home: match.score?.fullTime?.home ?? null,
      away: match.score?.fullTime?.away ?? null,
    },
  };
}

export async function GET() {
  const token = process.env.FOOTBALL_DATA_API_KEY;

  if (!token) {
    return Response.json(
      { configured: false, fixtures: [] } satisfies FixturesResponse,
      { status: 200 },
    );
  }

  try {
    const res = await fetch(`${API_BASE}/competitions/${COMPETITION}/matches`, {
      headers: { "X-Auth-Token": token },
      // The schedule is effectively static; scores lag on the free tier anyway.
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return Response.json(
        {
          configured: true,
          fixtures: [],
          error: `upstream_${res.status}`,
        } satisfies FixturesResponse,
        { status: 200 },
      );
    }

    const data = (await res.json()) as { matches?: UpstreamMatch[] };
    const fixtures = (data.matches ?? [])
      .map(toFixture)
      .sort((a, b) => a.utcDate.localeCompare(b.utcDate));

    return Response.json(
      { configured: true, fixtures } satisfies FixturesResponse,
      { status: 200 },
    );
  } catch {
    return Response.json(
      {
        configured: true,
        fixtures: [],
        error: "fetch_failed",
      } satisfies FixturesResponse,
      { status: 200 },
    );
  }
}
