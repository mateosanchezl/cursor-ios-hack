export type Venue = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  area: string;
  fanBases: string[];
  screens: "small" | "medium" | "large";
  seating: "standing" | "mixed" | "seated";
  vibes: string[];
  /** Rough standing/seated headcount, used for crowd + ranking signals. */
  capacity: number;
  /** 1 = cheap pint, 3 = pricey. */
  priceLevel: 1 | 2 | 3;
  /** Whether the venue takes table / area reservations for big matches. */
  bookable: boolean;
};

export type UserLocation = {
  lat: number;
  lng: number;
};

export type LocationStatus = "idle" | "locating" | "ready" | "denied" | "error";

export type Team = {
  /** Short code, e.g. "ENG". */
  code: string;
  name: string;
  /** Flag emoji for compact, dependency-free display. */
  flag: string;
  /** Aliases used to match against a venue's free-text fan bases. */
  aliases?: string[];
};

export type FixtureStage =
  | "Group"
  | "Round of 16"
  | "Quarter-final"
  | "Semi-final"
  | "Final";

export type Fixture = {
  id: string;
  homeCode: string;
  awayCode: string;
  /** ISO kickoff time. */
  kickoff: string;
  stage: FixtureStage;
  /** Host city of the actual match (not the watch venue). */
  hostCity: string;
};

/** Canonical, filterable vibe buckets that map onto free-text venue vibes. */
export type VibeKey = "rowdy" | "singing" | "chill" | "big-screen" | "outdoor";

export type Filters = {
  fixtureId: string | null;
  teamCode: string | null;
  vibe: VibeKey | null;
};

/** A venue plus its computed relevance for the active filters. */
export type RankedVenue = {
  venue: Venue;
  /** 0–100 relevance score. */
  score: number;
  /** Straight-line distance from the user in km, when known. */
  distanceKm: number | null;
  /** Short human-readable reasons this spot ranks where it does. */
  reasons: string[];
  /** True when the venue clearly hosts a crowd for the selected team/match. */
  isTribeMatch: boolean;
};
