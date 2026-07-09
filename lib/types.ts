export type VenueKind = "pub" | "bar" | "biergarten" | "cafe" | "venue";

/**
 * A watch-spot sourced from OpenStreetMap. Fields beyond the geometry are
 * best-effort — OSM tagging is sparse and inconsistent, so most are optional.
 */
export type Venue = {
  /** Stable OSM identifier, e.g. "node/12345". */
  id: string;
  name: string;
  lat: number;
  lng: number;
  kind: VenueKind;
  /** Human-friendly locality (suburb, city, or street) when available. */
  area?: string;
  address?: string;
  hasTv?: boolean;
  outdoorSeating?: boolean;
  website?: string;
};

export type VenuesResponse = {
  venues: Venue[];
  /** Present when the upstream query failed; venues will be empty. */
  error?: string;
};

export type UserLocation = {
  lat: number;
  lng: number;
};

export type LocationStatus = "idle" | "locating" | "ready" | "denied" | "error";

export type FixtureTeam = {
  name: string;
  shortName?: string;
  /** Three-letter abbreviation, e.g. "ARG". */
  tla?: string;
  crest?: string;
};

export type FixtureStatus =
  | "SCHEDULED"
  | "TIMED"
  | "IN_PLAY"
  | "PAUSED"
  | "FINISHED"
  | "SUSPENDED"
  | "POSTPONED"
  | "CANCELLED";

export type Fixture = {
  id: number;
  utcDate: string;
  status: FixtureStatus;
  stage?: string;
  group?: string | null;
  home: FixtureTeam;
  away: FixtureTeam;
  score: { home: number | null; away: number | null };
};

export type FixturesResponse = {
  /** False when the FOOTBALL_DATA_API_KEY env var is not set. */
  configured: boolean;
  fixtures: Fixture[];
  error?: string;
};
