import type { Fixture } from "@/lib/types";

type FixtureSeed = {
  home: string;
  away: string;
  stage: Fixture["stage"];
  hostCity: string;
  /** Days from "today" (0 = today). */
  dayOffset: number;
  /** Local kickoff hour, 24h. */
  hour: number;
};

/**
 * Knockout-stage sample fixtures. Times are anchored to the moment the app
 * loads so the demo always has a believable "today / upcoming" schedule.
 */
const FIXTURE_SEEDS: FixtureSeed[] = [
  { home: "ENG", away: "BRA", stage: "Quarter-final", hostCity: "New York", dayOffset: 0, hour: 20 },
  { home: "ARG", away: "FRA", stage: "Quarter-final", hostCity: "Dallas", dayOffset: 0, hour: 17 },
  { home: "ESP", away: "MEX", stage: "Quarter-final", hostCity: "Los Angeles", dayOffset: 1, hour: 20 },
  { home: "POR", away: "NED", stage: "Quarter-final", hostCity: "Miami", dayOffset: 1, hour: 17 },
  { home: "GER", away: "COL", stage: "Semi-final", hostCity: "Atlanta", dayOffset: 3, hour: 20 },
  { home: "FRA", away: "ESP", stage: "Semi-final", hostCity: "Toronto", dayOffset: 4, hour: 20 },
  { home: "ENG", away: "ARG", stage: "Final", hostCity: "New York", dayOffset: 6, hour: 19 },
  { home: "SEN", away: "MAR", stage: "Round of 16", hostCity: "Houston", dayOffset: 0, hour: 14 },
  { home: "ITA", away: "CRO", stage: "Round of 16", hostCity: "Boston", dayOffset: 2, hour: 15 },
];

function buildFixtures(now: Date = new Date()): Fixture[] {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);

  return FIXTURE_SEEDS.map((seed, index) => {
    const kickoff = new Date(startOfToday);
    kickoff.setDate(startOfToday.getDate() + seed.dayOffset);
    kickoff.setHours(seed.hour, 0, 0, 0);

    return {
      id: `fx-${index + 1}`,
      homeCode: seed.home,
      awayCode: seed.away,
      kickoff: kickoff.toISOString(),
      stage: seed.stage,
      hostCity: seed.hostCity,
    } satisfies Fixture;
  }).sort((a, b) => a.kickoff.localeCompare(b.kickoff));
}

/**
 * Fixtures for this session. Evaluated on the client only (the map is rendered
 * with `ssr: false`), so anchoring to `new Date()` is safe from hydration.
 */
export const FIXTURES: Fixture[] = buildFixtures();
