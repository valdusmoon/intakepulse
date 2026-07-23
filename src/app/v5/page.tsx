import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { V5HeroScenes } from "@/components/marketing/v5/V5HeroScenes";
import { V5JobsVsMessages } from "@/components/marketing/v5/V5JobsVsMessages";
import { V5LeakCalculator } from "@/components/marketing/v5/V5LeakCalculator";
import { AudioSlot, BrowserFrame } from "@/components/marketing/v5/V5MediaSlot";
import { V5PricingCard } from "@/components/marketing/v5/V5PricingCard";
import { V5SeeItWork } from "@/components/marketing/v5/V5SeeItWork";

/**
 * /v5 — LOCKED-COPY rebuild (throwaway, noindex).
 *
 * Rebuilt onto the founder's locked homepage copy (docs/landing-copy-v5-v6.md)
 * in the locked section arc: Hero → The Leak → How It Works → See It Work →
 * Jobs vs Messages → Hear It → Built for your trade → The math → Pricing → FAQ →
 * Closing CTA. Same v4-derived look and feel (centered light hero dropping into
 * the call → intake → ranked-lead demo, section band rhythm, card styles), new
 * structure and words. Every page-body component is PAGE-SCOPED under
 * components/marketing/v5/ so /v5 iterates without touching /, /v6, or /v7.
 */

export const metadata: Metadata = {
  title: "Callverted | Stop Losing Jobs",
  robots: { index: false, follow: false },
};

const TRUST_LINE = "14-day free trial · your team gets the call first · no per-lead fees";

const HERO_SUBHEAD =
  "Capture every inbound opportunity—from missed calls, answered calls, and website inquiries. Every opportunity is documented, qualified, and prioritized, so your team knows exactly who to call back first.";

const I = {
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
} as const;

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-widest text-landing-primary ${className}`}>{children}</p>;
}

// A real-looking OS call-log chip that floats over each pain photo.
function PainChip({ chip }: { chip: { tone: "missed" | "web" | "hot"; top: string; sub: string } }) {
  const red = chip.tone !== "web";
  const icon =
    chip.tone === "missed"
      ? "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z"
      : chip.tone === "web"
        ? "M3 5h18v11H3zM3 20h18M9 20v-4M15 20v-4"
        : "M12 3l8 15H4zM12 9v4M12 16v.5";
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-white/92 pl-2.5 pr-4 py-2.5 shadow-[0_16px_38px_-12px_rgba(0,0,0,0.6)] ring-1 ring-black/[0.06] backdrop-blur-md">
      <span className={`grid h-9 w-9 place-items-center rounded-full text-white ${red ? "bg-[#e5484d]" : "bg-[#475467]"}`}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d={icon} />
        </svg>
      </span>
      <div className="text-left">
        <p className="text-[13px] font-semibold leading-tight text-[#0f141e]">{chip.top}</p>
        <p className={`mt-0.5 text-[11.5px] leading-tight ${red ? "font-semibold text-[#e5484d]" : "text-[#8a94a6]"}`}>
          {chip.sub}
        </p>
      </div>
    </div>
  );
}

// ── §2 The Leak — three distinct failure modes ──────────────────────────────
const PAINS: { img: string; title: string; body: string; chip: { tone: "missed" | "web" | "hot"; top: string; sub: string } }[] = [
  {
    img: "/pain/busy.jpg",
    title: "The call rings out.",
    body: "Nobody's free, or it's 11 PM. The caller doesn't leave a voicemail — they dial the next company on the list.",
    chip: { tone: "missed", top: "Missed", sub: "on a job" },
  },
  {
    img: "/pain/afterhours.jpg",
    title: "The details never get written down.",
    body: "The call your team answered, or the web form nobody worked, lives in someone's memory until it's gone.",
    chip: { tone: "web", top: "Web lead", sub: "never worked" },
  },
  {
    img: "/pain/nextcompany.jpg",
    title: "The big job waits behind the small one.",
    body: "Five callbacks in the queue and no way to tell the $9k emergency from the $150 tune-up, so you call back in the wrong order.",
    chip: { tone: "hot", top: "Hot lead", sub: "called back 4th" },
  },
];

// ── §3 How It Works — four steps ────────────────────────────────────────────
const STEPS = [
  {
    t: "Your team gets the call first.",
    d: "You publish one Callverted number. Every call rings your existing phones first, so nothing changes for the work you already catch.",
    icon: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z",
  },
  {
    t: "Callverted captures the rest.",
    d: "Missed, after-hours, and overflow calls, the calls your team answers, and every website inquiry.",
    icon: "M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3M12 3v11M8 10l4 4 4-4",
  },
  {
    t: "It sorts and scores.",
    d: "Each one becomes a qualified job, a tidy message, or a screened non-lead. Real jobs get scored by urgency and value.",
    icon: "M4 6h16M4 12h10M4 18h6",
  },
  {
    t: "Your team gets a ranked list.",
    d: "Callback-ready lead packets, highest-priority job at the top, so you call the money back first.",
    icon: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z",
  },
];

// ── §7 Built for your trade — one high-value scenario each ───────────────────
const TRADES = [
  {
    name: "Restoration",
    img: "/industries/restoration.jpg",
    body: "Water loss, fire damage, mold, and emergency mitigation, captured with the details that determine urgency.",
  },
  {
    name: "HVAC",
    img: "/industries/hvac.jpg",
    body: "No-heat and no-cool emergencies, system age, and repair-vs-replacement, so the $9k system doesn't get booked like a tune-up.",
  },
  {
    name: "Plumbing",
    img: "/industries/plumbing.jpg",
    body: "Burst lines, sewage backups, and no-water calls, captured with shutoff status and what's flooding, so you know what to roll and how fast.",
  },
  {
    name: "Electrical",
    img: "/industries/electrical.jpg",
    body: "Burning smells, dead panels, and no-power calls, flagged as hazards and routed to your on-call instead of parked until morning.",
  },
];

// ── §9 Pricing — done-with-you risk reversal ────────────────────────────────
const DONE_WITH_YOU = [
  "We build your call flow and lead sources with you.",
  "You approve every service, price, and question before launch.",
  "We run test calls together before a customer ever hears it.",
  "A real person helps you tune it after launch.",
  "No contracts. Cancel anytime. It should pay for itself on one recovered job.",
];

// ── §10 FAQ — full category-clarifying set ───────────────────────────────────
const FAQ_V5 = [
  {
    q: "Is this an AI receptionist?",
    a: "No. An answering service takes a message. Callverted captures the opportunity, sorts a real job from a message, scores and ranks the jobs, and tells your team who to call back first. It captures calls and website inquiries, not just missed calls.",
  },
  {
    q: "Does it replace my phone number?",
    a: "No. You publish a Callverted number that rings your team first on every call. It only steps in when nobody picks up.",
  },
  {
    q: "Does it handle website leads too?",
    a: "Yes. Add the widget or share your intake link. Those go through the same qualification, scoring, and sorting as phone calls.",
  },
  {
    q: "What about the calls my team answers?",
    a: "Switch on capture and the calls your team takes get transcribed, summarized, and scored too, so the details stop living in someone's head. The audio is deleted once transcribed, never stored.",
  },
  {
    q: "Will the AI answer questions or book appointments?",
    a: "No, and that's on purpose. It captures, it does not improvise. Callers only hear pricing you approved, word for word. If there's no approved answer, it says your team will follow up.",
  },
  {
    q: "What happens on an emergency?",
    a: "It separates a true emergency from a routine ask, flags it, and alerts your on-call instead of parking it until morning.",
  },
  {
    q: "How fast can we launch?",
    a: "About 30 minutes of setup: call flow, service area, pricing rules, and test calls. We walk through it with you.",
  },
];

const CTA_ALERTS: { tier: "front" | "bg"; cls: string; text: string; img?: string }[] = [
  { tier: "bg", text: "New lead · $2,100", cls: "top-[9%] right-[40%]" },
  { tier: "bg", text: "New lead · $8,900", cls: "bottom-[8%] right-[34%]" },
  { tier: "front", text: "New lead · $11,800", img: "/avatars/lead-1.jpg", cls: "top-[1%] right-[-16%]" },
  { tier: "front", text: "New lead · $9,200", img: "/avatars/lead-2.jpg", cls: "top-[25%] right-[6%]" },
  { tier: "front", text: "New lead · $6,400", img: "/avatars/lead-3.jpg", cls: "top-[50%] right-[26%]" },
  { tier: "front", text: "New lead · $3,750", img: "/avatars/lead-4.jpg", cls: "bottom-[3%] right-[10%]" },
];

export default function V5Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v5logo" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#demo" className="hidden font-medium text-white/90 transition-colors hover:text-white md:block">See it work</a>
          <a href="#trades" className="hidden font-medium text-white/90 transition-colors hover:text-white lg:block">Trades</a>
          <a href="#pricing" className="hidden font-medium text-white/90 transition-colors hover:text-white sm:block">Pricing</a>
          <BookDemo className="hidden font-medium text-white/90 transition-colors hover:text-white md:block">Book a demo</BookDemo>
          <AuthAwareNavCta />
        </div>
      </LandingNavShell>

      {/* ── 1 · Hero — centered, light, demo right under the headline ─────── */}
      <section className="relative overflow-hidden bg-white px-6 pt-32 pb-16 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
          aria-hidden
          style={{ background: "radial-gradient(70% 60% at 50% 0%, rgba(36,84,216,0.09) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e3e7ed] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />
            Lead recovery for home-service trades
          </span>
          <h1 className="font-cv-heading mb-5 text-[42px] font-bold leading-[1.0] tracking-[-0.038em] sm:text-[64px]">
            Stop losing jobs.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-[17px] leading-relaxed text-[#667085]">{HERO_SUBHEAD}</p>
          <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-xl bg-landing-primary px-7 py-3.5 text-center font-semibold text-white shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)] transition-colors hover:bg-blue-600"
            >
              Start recovering leads
            </Link>
            <BookDemo className="rounded-xl border border-[#e3e7ed] bg-white px-7 py-3.5 text-center font-medium text-[#344054] transition-colors hover:border-[#cbd5e5] hover:bg-[#f9fafb]">
              Book a demo
            </BookDemo>
          </div>
          <p className="text-[12.5px] font-medium text-[#98a2b3]">{TRUST_LINE}</p>
        </ScrollReveal>

        <ScrollReveal delay={120} className="mx-auto mt-14 max-w-5xl">
          <V5HeroScenes />
        </ScrollReveal>
      </section>

      {/* ── 2 · The Leak — three failure-mode photo cards ────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-12 max-w-2xl">
            <Eyebrow className="mb-3">The leak</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-[52px]">
              {"There's more than one way to lose a job."}
            </h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">
              Every inbound opportunity that goes uncaptured, undocumented, or unprioritized is a job your competitor can win.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PAINS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 110} className="relative h-[440px] overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,14,28,0.9) 0%, rgba(9,14,28,0.62) 30%, rgba(9,14,28,0.5) 55%, rgba(9,14,28,0.76) 100%)" }} aria-hidden />
                <div className="relative flex h-full flex-col p-6">
                  <h3 className="font-cv-heading mb-2 max-w-[15ch] text-[22px] font-bold leading-snug text-white">{p.title}</h3>
                  <p className="max-w-[30ch] text-[13.5px] leading-relaxed text-white/85">{p.body}</p>
                  <div className="mt-auto"><PainChip chip={p.chip} /></div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3 · How It Works — four steps ────────────────────────────────── */}
      <section id="how" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow className="mb-3">How it works</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-[46px]">
              Every way in. One ranked list out.
            </h2>
            <p className="text-[15px] leading-relaxed text-[#667085]">
              One system on your phone line and your website makes sure nothing that comes in gets lost.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.t} delay={(i % 4) * 90} className="flex h-full flex-col rounded-3xl border border-[#e3e7ed] bg-white p-6">
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-landing-primary/10 text-landing-primary">
                    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                  </span>
                  <span className="font-cv-mono text-[11px] font-bold text-[#c1c8d3]">0{i + 1}</span>
                </div>
                <h3 className="font-cv-heading mb-2 text-[16px] font-bold leading-snug text-[#152033]">{s.t}</h3>
                <p className="text-[13.5px] leading-relaxed text-[#667085]">{s.d}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 · See It Work — example selector + real dashboard shot ──────── */}
      <section id="demo" className="scroll-mt-20 bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
            <Eyebrow className="mb-3">See it work</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold tracking-[-0.035em] sm:text-[44px]">
              Watch a call become a ranked lead.
            </h2>
            <p className="text-[15px] leading-relaxed text-[#667085]">
              The caller just talks. The details appear live, the score assembles the moment they hang up, and nobody on your team typed a thing.
            </p>
          </ScrollReveal>
          <ScrollReveal>
            <V5SeeItWork />
          </ScrollReveal>
          <ScrollReveal delay={120} className="mt-12">
            <p className="mb-4 text-center text-[13.5px] font-semibold text-[#344054]">
              Every opportunity lands in one place, highest priority first.
            </p>
            <BrowserFrame url="app.callverted.com/dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/product/dashboard.png" alt="Callverted dashboard showing captured opportunity value, confirmed won revenue, and a ranked list of priority leads" width={2048} height={1392} className="h-auto w-full" />
            </BrowserFrame>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5 · Jobs vs Messages — two-card ──────────────────────────────── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">Not every call is a job.</h2>
            <p className="text-[15px] text-[#667085]">Callverted knows the difference.</p>
          </ScrollReveal>
          <ScrollReveal>
            <V5JobsVsMessages />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6 · Hear It — press-play sample call ─────────────────────────── */}
      <section id="hear" className="scroll-mt-20 bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl text-center">
          <Eyebrow className="mb-3">Hear it</Eyebrow>
          <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            Hear what your customer hears.
          </h2>
          <p className="mb-8 text-[15px] leading-relaxed text-[#667085]">
            Press play. This is the intake, start to finish. No hold music, no voicemail, no menu.
          </p>
          <div className="text-left">
            <AudioSlot
              title="Sample intake call · after-hours water damage"
              note="The intake, start to finish, ending on the callback confirmation."
              duration="0:24"
              prompt="Record a ~24s intake call: caller reports a burst pipe flooding the kitchen, the assistant confirms it is an emergency, gets the address and shutoff status, and ends by naming the business and promising a fast callback. Warm, brisk, human."
            />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 7 · Built for your trade — scenario cards ────────────────────── */}
      <section id="trades" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow className="mb-3">Built for your trade</Eyebrow>
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              {"It knows what your trade's calls sound like."}
            </h2>
            <p className="text-[15px] text-[#667085]">
              {"The questions it asks and the way it scores change by trade. Here's a real scenario from each."}
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {TRADES.map((t, i) => (
              <ScrollReveal key={t.name} delay={(i % 2) * 90} className="overflow-hidden rounded-2xl border border-[#e3e7ed] bg-white">
                <div className="relative h-40">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={t.img} alt={t.name} className="h-full w-full object-cover object-[50%_32%]" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4">
                    <span className="font-cv-heading text-[17px] font-bold text-white drop-shadow-sm">{t.name}</span>
                  </div>
                </div>
                <p className="p-5 text-[14px] leading-relaxed text-[#475467]">{t.body}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8 · The math (ROI) — three-input leak calculator ─────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow className="mb-3">The math</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] text-[#152033] sm:text-[42px]">
              The leak is already costing you.
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-[#667085]">
              {"The question isn't what Callverted costs. It's what missed and mishandled opportunities are already costing you."}
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-landing-ink p-6 shadow-[0_40px_90px_-40px_rgba(16,24,40,0.5)] sm:p-7">
            <V5LeakCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 9 · Pricing + done with you ──────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-12 lg:grid-cols-[0.95fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <Eyebrow className="mb-3">Pricing</Eyebrow>
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">One flat price. Everything included.</h2>
            <p className="mx-auto mb-6 max-w-md text-[14.5px] text-[#667085] lg:mx-0">
              Missed-call answering, answered-call capture, website intake, lead scoring and sorting, alerts, and weekly reports. No per-call or per-lead fees.
            </p>
            <V5PricingCard />
          </div>
          <div>
            <Eyebrow className="mb-3">Done with you</Eyebrow>
            <h3 className="font-cv-heading mb-6 text-2xl font-bold leading-[1.1] tracking-[-0.035em] sm:text-[28px]">
              We help set it up, not just hand you software.
            </h3>
            <div className="space-y-4">
              {DONE_WITH_YOU.map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <p className="text-[15px] font-semibold leading-snug text-[#344054]">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── 10 · FAQ ─────────────────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Eyebrow className="mb-3">FAQ</Eyebrow>
            <h2 className="font-cv-heading text-2xl font-bold tracking-[-0.035em] sm:text-3xl">Questions owners ask first</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e3e7ed] bg-white">
            {FAQ_V5.map((faq, i) => (
              <details key={faq.q} className={`group ${i > 0 ? "border-t border-[#e3e7ed]" : ""} [&_summary::-webkit-details-marker]:hidden`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-bold">
                  {faq.q}
                  <svg className="h-4 w-4 shrink-0 text-[#98a2b3] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-[#667085]">{faq.a}</p>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── 11 · Closing CTA — gradient card with lead-alert chips ────────── */}
      <section className="border-t border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-white shadow-[0_30px_60px_-24px_rgba(28,63,168,0.5)] sm:px-10 sm:py-16" style={{ background: "linear-gradient(135deg, #2a5ae0 0%, #1c3fa8 55%, #16307e 100%)" }}>
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,470px)_1fr]">
              <div className="relative z-10 mx-auto max-w-lg text-center lg:mx-0 lg:text-left">
                <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-4xl">
                  Stop losing jobs.
                </h2>
                <p className="mb-8 text-[15px] text-white/70">Give your team the first ring. Callverted captures, sorts, and ranks the rest.</p>
                <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                  <Link href="/sign-up" className="whitespace-nowrap rounded-xl bg-white px-6 py-3.5 text-center font-semibold text-landing-primary shadow-lg transition-colors hover:bg-[#f0f4ff]">Start recovering leads</Link>
                  <BookDemo className="whitespace-nowrap rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-center font-semibold text-white transition-colors hover:bg-white/20">Book a 15-min demo</BookDemo>
                </div>
                <p className="mt-5 text-[12.5px] text-white/60">{TRUST_LINE}</p>
              </div>
              <div className="relative hidden h-[360px] lg:block" aria-hidden>
                {CTA_ALERTS.map((a, i) => {
                  const front = a.tier === "front";
                  return (
                    <div key={i} className={`absolute ${a.cls} ${front ? "z-10" : "z-0 opacity-45 blur-[3px]"}`}>
                      <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${front ? "border border-white/25 bg-white/[0.17] shadow-[0_18px_36px_-16px_rgba(0,0,0,0.55)]" : "border border-white/10 bg-white/[0.10]"}`}>
                        {front && a.img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.img} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/30" />
                        ) : (
                          <span className="h-9 w-9 shrink-0 rounded-full bg-white/25" />
                        )}
                        <span className="whitespace-nowrap text-[15px] font-semibold">{a.text}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      <MarketingFooter />
      <JsonLd data={faqSchema(FAQ_V5)} />

      <BookDemo
        title="Questions before you start?"
        blurb="Book a quick call or leave your details — a real person (not a bot) will get back to you, usually same day."
        className="fixed bottom-5 right-5 z-50 hidden items-center gap-2.5 rounded-full bg-landing-primary pl-4 pr-5 py-3 text-white shadow-[0_12px_30px_-8px_rgba(36,84,216,0.6)] transition-colors hover:bg-blue-600 sm:flex"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={I.chat} /></svg>
        <span className="text-sm font-semibold">Questions? Talk to us</span>
      </BookDemo>
    </div>
  );
}
