"use client";

import dynamic from "next/dynamic";

const WatchMap = dynamic(() => import("@/components/map/WatchMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-dvh w-full items-center justify-center bg-[#0b1510] text-[#c8e6c9]">
      <p className="font-[family-name:var(--font-display)] text-xl tracking-tight">
        Loading map…
      </p>
    </div>
  ),
});

export default function Home() {
  return <WatchMap />;
}
