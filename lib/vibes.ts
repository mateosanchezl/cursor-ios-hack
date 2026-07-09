import type { Venue, VibeKey } from "@/lib/types";

type VibeDef = {
  key: VibeKey;
  label: string;
  emoji: string;
  /** Free-text venue vibe tags that count as a match for this bucket. */
  tags: string[];
};

export const VIBES: VibeDef[] = [
  { key: "rowdy", label: "Rowdy", emoji: "🔥", tags: ["loud", "packed", "big-nights", "standing-ok"] },
  { key: "singing", label: "Singing", emoji: "🎶", tags: ["singing", "loud"] },
  { key: "chill", label: "Chilled", emoji: "😌", tags: ["chill", "food", "seated"] },
  { key: "big-screen", label: "Big screen", emoji: "📺", tags: ["big-screen"] },
  { key: "outdoor", label: "Outdoor", emoji: "🌤️", tags: ["outdoor"] },
];

const VIBE_BY_KEY = new Map(VIBES.map((vibe) => [vibe.key, vibe]));

export function getVibe(key: VibeKey | null | undefined): VibeDef | null {
  if (!key) return null;
  return VIBE_BY_KEY.get(key) ?? null;
}

/** Whether a venue satisfies the given vibe bucket. */
export function venueMatchesVibe(venue: Venue, key: VibeKey): boolean {
  const def = VIBE_BY_KEY.get(key);
  if (!def) return true;
  if (key === "big-screen" && venue.screens === "large") return true;
  return venue.vibes.some((tag) => def.tags.includes(tag));
}
