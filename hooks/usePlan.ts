"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Plan } from "@/lib/types";
import { readJSON, writeJSON } from "@/lib/storage";
import { clearPlanParam, readPlanFromUrl } from "@/lib/plan-share";

const STORAGE_KEY = "tribewatch.plan.v1";
const EMPTY_PLAN: Plan = { saved: [], rsvps: [] };

function rsvpKey(fixtureId: string, venueId: string): string {
  return `${fixtureId}::${venueId}`;
}

function toggle(list: string[], value: string): string[] {
  return list.includes(value)
    ? list.filter((item) => item !== value)
    : [...list, value];
}

function mergePlans(a: Plan, b: Plan): Plan {
  return {
    saved: Array.from(new Set([...a.saved, ...b.saved])),
    rsvps: Array.from(new Set([...a.rsvps, ...b.rsvps])),
  };
}

export type UsePlan = {
  plan: Plan;
  isSaved: (venueId: string) => boolean;
  toggleSaved: (venueId: string) => void;
  isGoing: (fixtureId: string, venueId: string) => boolean;
  toggleGoing: (fixtureId: string, venueId: string) => void;
  goingVenueIdsFor: (fixtureId: string) => string[];
  savedCount: number;
  rsvpCount: number;
};

export function usePlan(): UsePlan {
  const [plan, setPlan] = useState<Plan>(() => {
    const stored = readJSON<Plan>(STORAGE_KEY, EMPTY_PLAN);
    const shared = readPlanFromUrl();
    return shared ? mergePlans(stored, shared) : stored;
  });

  // Tidy the ?plan= param out of the URL after hydration (no state change).
  useEffect(() => {
    clearPlanParam();
  }, []);

  useEffect(() => {
    writeJSON(STORAGE_KEY, plan);
  }, [plan]);

  const isSaved = useCallback(
    (venueId: string) => plan.saved.includes(venueId),
    [plan.saved],
  );
  const toggleSaved = useCallback((venueId: string) => {
    setPlan((prev) => ({ ...prev, saved: toggle(prev.saved, venueId) }));
  }, []);

  const isGoing = useCallback(
    (fixtureId: string, venueId: string) =>
      plan.rsvps.includes(rsvpKey(fixtureId, venueId)),
    [plan.rsvps],
  );
  const toggleGoing = useCallback((fixtureId: string, venueId: string) => {
    setPlan((prev) => ({
      ...prev,
      rsvps: toggle(prev.rsvps, rsvpKey(fixtureId, venueId)),
    }));
  }, []);

  const goingVenueIdsFor = useCallback(
    (fixtureId: string) =>
      plan.rsvps
        .filter((key) => key.startsWith(`${fixtureId}::`))
        .map((key) => key.split("::")[1]),
    [plan.rsvps],
  );

  return useMemo(
    () => ({
      plan,
      isSaved,
      toggleSaved,
      isGoing,
      toggleGoing,
      goingVenueIdsFor,
      savedCount: plan.saved.length,
      rsvpCount: plan.rsvps.length,
    }),
    [plan, isSaved, toggleSaved, isGoing, toggleGoing, goingVenueIdsFor],
  );
}
