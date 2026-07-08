"use client";

import dynamic from "next/dynamic";

// The Player uses browser-only APIs (ResizeObserver, rAF), so it's excluded
// from SSR — this small client boundary is what makes that possible while
// keeping the landing page itself a server component.
const PhoneCallPlayer = dynamic(() => import("./PhoneCallPlayer").then((m) => m.PhoneCallPlayer), {
  ssr: false,
  loading: () => <PhoneMockupSkeleton />,
});

function PhoneMockupSkeleton() {
  return (
    <div className="mx-auto max-w-[300px] animate-pulse">
      <div className="relative w-[280px] sm:w-[300px] mx-auto rounded-[2.5rem] border border-[#232d47] bg-[#05070d] p-2.5">
        <div className="rounded-[2rem] bg-[#0a0f1c]" style={{ aspectRatio: "360 / 740" }} />
      </div>
      <div className="mt-6 grid grid-cols-2 gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-[52px] rounded-xl border border-white/10 bg-white/[0.03]" />
        ))}
      </div>
      <div className="mt-3 h-[2.5em]" />
    </div>
  );
}

export function HeroPhoneAnimation() {
  return <PhoneCallPlayer />;
}
