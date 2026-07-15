"use client";

import { useEffect, useState } from "react";

/**
 * Chrome for the landing-page nav. The nav is pinned so the sign-up CTA stays
 * reachable from anywhere on the page, which it can't do with a fixed background:
 * over the hero photo it has to stay transparent (that's the design), but over the
 * white body sections its white links would be invisible. So it fades in the same
 * ink background the subpage nav uses (see MarketingNav) as soon as you scroll,
 * and the whole site resolves to one consistent bar.
 *
 * `fixed`, not `sticky`, because the nav overlays the hero instead of sitting
 * above it in flow — the hero's top padding is what clears it.
 *
 * Only the scroll state lives here; the nav's contents stay server-rendered and
 * are passed in as children.
 */
export function LandingNavShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32);
    onScroll(); // catch a restored scroll position on back-nav / refresh
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-40 px-6 py-4 transition-colors duration-300 ${
        scrolled ? "bg-landing-ink border-b border-white/10" : "border-b border-transparent"
      }`}
    >
      {/* Scrim — over the hero, the photo behind the nav changes brightness as the
          scene carousel rotates, so the links need a guaranteed backdrop. Once the
          ink background takes over it's redundant, so it fades out with it. */}
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 via-black/20 to-transparent transition-opacity duration-300 ${
          scrolled ? "opacity-0" : "opacity-100"
        }`}
        aria-hidden
      />
      <div className="relative max-w-6xl mx-auto flex items-center justify-between">{children}</div>
    </nav>
  );
}
