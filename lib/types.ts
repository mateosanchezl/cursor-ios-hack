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
};

export type UserLocation = {
  lat: number;
  lng: number;
};

export type LocationStatus = "idle" | "locating" | "ready" | "denied" | "error";
