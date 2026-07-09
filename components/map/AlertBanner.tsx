"use client";

import { Bell, BellRing, X } from "lucide-react";

type AlertBannerProps = {
  headline: string;
  detail: string;
  notified: boolean;
  onNotify: () => void;
  onView: () => void;
  onDismiss: () => void;
};

export function AlertBanner({
  headline,
  detail,
  notified,
  onNotify,
  onView,
  onDismiss,
}: AlertBannerProps) {
  return (
    <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-[#f5c451]/30 bg-[#171207]/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[#f5c451]/15 text-[#f5c451]">
        <BellRing className="size-4" aria-hidden />
      </div>
      <button type="button" onClick={onView} className="min-w-0 text-left">
        <p className="truncate text-sm font-medium text-[#f7e6b8]">{headline}</p>
        <p className="truncate text-xs text-[#c9b88a]">{detail}</p>
      </button>
      <div className="ml-auto flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={onNotify}
          className={
            "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition " +
            (notified
              ? "bg-[#f5c451]/20 text-[#f5c451]"
              : "bg-[#f5c451] text-[#1b1400] hover:bg-[#f0bb35]")
          }
        >
          <Bell className="size-3.5" aria-hidden />
          {notified ? "Alert set" : "Alert me"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-full p-1 text-[#c9b88a] hover:text-[#f7e6b8]"
          aria-label="Dismiss"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}
