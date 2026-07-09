"use client";

import { useCallback, useEffect, useState } from "react";
import type { Venue } from "@/lib/types";
import { readJSON, writeJSON } from "@/lib/storage";

const STORAGE_KEY = "tribewatch.userVenues.v1";

export type UseUserVenues = {
  userVenues: Venue[];
  addVenue: (venue: Venue) => void;
  removeVenue: (id: string) => void;
};

export function useUserVenues(): UseUserVenues {
  const [userVenues, setUserVenues] = useState<Venue[]>(() =>
    readJSON<Venue[]>(STORAGE_KEY, []),
  );

  useEffect(() => {
    writeJSON(STORAGE_KEY, userVenues);
  }, [userVenues]);

  const addVenue = useCallback((venue: Venue) => {
    setUserVenues((prev) => [...prev, venue]);
  }, []);

  const removeVenue = useCallback((id: string) => {
    setUserVenues((prev) => prev.filter((venue) => venue.id !== id));
  }, []);

  return { userVenues, addVenue, removeVenue };
}
