import type { Plan } from "@/lib/types";

const PARAM = "plan";

export function encodePlan(plan: Plan): string {
  if (typeof window === "undefined") return "";
  try {
    return window.btoa(encodeURIComponent(JSON.stringify(plan)));
  } catch {
    return "";
  }
}

export function decodePlan(encoded: string): Plan | null {
  try {
    const parsed = JSON.parse(decodeURIComponent(window.atob(encoded)));
    if (
      parsed &&
      Array.isArray(parsed.saved) &&
      Array.isArray(parsed.rsvps)
    ) {
      return { saved: parsed.saved, rsvps: parsed.rsvps };
    }
    return null;
  } catch {
    return null;
  }
}

export function planShareUrl(plan: Plan): string {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.searchParams.set(PARAM, encodePlan(plan));
  return url.toString();
}

export function readPlanFromUrl(): Plan | null {
  if (typeof window === "undefined") return null;
  const encoded = new URLSearchParams(window.location.search).get(PARAM);
  return encoded ? decodePlan(encoded) : null;
}

/** Remove the ?plan= param from the address bar after hydrating. */
export function clearPlanParam(): void {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.searchParams.has(PARAM)) return;
  url.searchParams.delete(PARAM);
  window.history.replaceState({}, "", url.toString());
}
