"use client";

import { useEffect, useState } from "react";
import { FIXTURES } from "@/data/fixtures";
import type { Fixture } from "@/lib/types";

export type FixturesSource = "live" | "sample";

export type FixturesState = {
  fixtures: Fixture[];
  source: FixturesSource;
  loading: boolean;
};

/**
 * Loads fixtures from the `/api/fixtures` route handler (which proxies a live
 * provider when configured) and gracefully falls back to bundled samples.
 */
export function useFixtures(): FixturesState {
  const [state, setState] = useState<FixturesState>({
    fixtures: FIXTURES,
    source: "sample",
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    fetch("/api/fixtures", { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : Promise.reject()))
      .then((data: { fixtures?: Fixture[]; source?: string }) => {
        if (cancelled) return;
        const fixtures = Array.isArray(data.fixtures) ? data.fixtures : [];
        if (fixtures.length > 0 && data.source === "live") {
          setState({ fixtures, source: "live", loading: false });
        } else {
          setState({ fixtures: FIXTURES, source: "sample", loading: false });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setState({ fixtures: FIXTURES, source: "sample", loading: false });
        }
      })
      .finally(() => clearTimeout(timeout));

    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeout);
    };
  }, []);

  return state;
}
