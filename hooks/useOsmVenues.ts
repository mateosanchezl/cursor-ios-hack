"use client";

import { useCallback, useState } from "react";
import type { UserLocation, Venue } from "@/lib/types";
import { fetchNearbyVenues } from "@/lib/osm";

export type UseOsmVenues = {
  osmVenues: Venue[];
  osmLoading: boolean;
  osmError: string | null;
  searchArea: (center: UserLocation, radiusMeters?: number) => Promise<void>;
  clearOsm: () => void;
};

export function useOsmVenues(): UseOsmVenues {
  const [osmVenues, setOsmVenues] = useState<Venue[]>([]);
  const [osmLoading, setOsmLoading] = useState(false);
  const [osmError, setOsmError] = useState<string | null>(null);

  const searchArea = useCallback(
    async (center: UserLocation, radiusMeters = 1500) => {
      setOsmLoading(true);
      setOsmError(null);
      try {
        const results = await fetchNearbyVenues(center, radiusMeters);
        setOsmVenues(results);
        if (results.length === 0) {
          setOsmError("No extra spots found in this area");
        }
      } catch {
        setOsmError("Couldn't reach OpenStreetMap — try again");
      } finally {
        setOsmLoading(false);
      }
    },
    [],
  );

  const clearOsm = useCallback(() => {
    setOsmVenues([]);
    setOsmError(null);
  }, []);

  return { osmVenues, osmLoading, osmError, searchArea, clearOsm };
}
