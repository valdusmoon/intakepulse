import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { V7HeroScenesProvider, V7HeroBackdrop, V7HeroSceneCard } from "@/components/marketing/v7/V7HeroScenes";
import { V7ExtractionDemo } from "@/components/marketing/v7/V7Interactive";
import { V7JobsVsMessages } from "@/components/marketing/v7/V7JobsVsMessages";
import { V7LeakCalculator } from "@/components/marketing/v7/V7LeakCalculator";
import { V7AudioSlot, V7BrowserFrame } from "@/components/marketing/v7/V7Media";
import { V7PricingCard } from "@/components/marketing/v7/V7PricingCard";
import { V7SeeItWork } from "@/components/marketing/v7/V7SeeItWork";

/**
 * /v7 — landing draft (throwaway, noindex). Uses the LOCKED homepage copy
 * (docs/landing-copy-v5-v6.md) in the locked 11-section arc, styled after the
 * live base homepage `/`. Every visual/content component it renders is
 * page-scoped under components/marketing/v7/, so /v7 iterates independently of
 * /, /v5, and /v6.
 *
 * Arc: Hero → The Leak → How It Works → See It Work → Jobs vs Messages →
 * Hear It → Built for your trade → The math (ROI) → Pricing → FAQ → Closing CTA.
 */

export const metadata: Metadata = {
  title: "Callverted | Stop Losing Jobs",
  robots: { index: false, follow: false },
};

const I = {
  phone: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z",
  capture: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4",
  sort: "M4 6h16M4 12h10M4 18h6",
  rank: "M5 12h14M13 6l6 6-6 6",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
} as const;

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-widest text-landing-primary ${className}`}>{children}</p>;
}

// ── Section 2: The Leak — three failure modes ────────────────────────────────
type LeakChip = { kind: "missed" | "web" | "hot"; label: string };
const LEAKS: { img: string; title: string; body: string; chip: LeakChip }[] = [
  {
    img: "/pain/busy.jpg",
    title: "The call rings out.",
    body: "Nobody's free, or it's 11 PM. The caller doesn't leave a voicemail — they dial the next company on the list.",
    chip: { kind: "missed", label: "Missed · on a job" },
  },
  {
    img: "/pain/afterhours.jpg",
    title: "The details never get written down.",
    body: "The call your team answered, or the web form nobody worked, lives in someone's memory until it's gone.",
    chip: { kind: "web", label: "Web lead · never worked" },
  },
  {
    img: "/pain/nextcompany.jpg",
    title: "The big job waits behind the small one.",
    body: "Five callbacks in the queue and no way to tell the $9k emergency from the $150 tune-up, so you call back in the wrong order.",
    chip: { kind: "hot", label: "Hot lead · called back 4th" },
  },
];

function LeakChipTag({ chip }: { chip: LeakChip }) {
  const tone =
    chip.kind === "missed"
      ? { bg: "bg-[#e5484d]", icon: I.phone }
      : chip.kind === "web"
        ? { bg: "bg-[#475467]", icon: "M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20M4.5 6a9 9 0 0 0 15 0M4.5 18a9 9 0 0 1 15 0" }
        : { bg: "bg-[#f59e0b]", icon: "M12 3s5 4 5 9a5 5 0 0 1-10 0c0-1 .3-2 .8-2.8C8 11 9 12 10 12c-1-3 2-9 2-9z" };
  return (
    <div className="inline-flex items-center gap-2.5 rounded-2xl bg-white/92 pl-2.5 pr-4 py-2.5 shadow-[0_16px_38px_-12px_rgba(0,0,0,0.6)] ring-1 ring-black/[0.06] backdrop-blur-md">
      <span className={`grid h-8 w-8 place-items-center rounded-full text-white ${tone.bg}`}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill={chip.kind === "missed" || chip.kind === "hot" ? "currentColor" : "none"} stroke="currentColor" strokeWidth={chip.kind === "web" ? 2 : 0} strokeLinecap="round" strokeLinejoin="round">
          <path d={tone.icon} />
        </svg>
      </span>
      <span className="font-cv-mono text-[12px] font-bold text-[#0f141e]">{chip.label}</span>
    </div>
  );
}

// ── Section 3: How It Works — four steps ─────────────────────────────────────
const STEPS = [
  { n: 1, icon: I.phone, t: "Your team gets the call first.", d: "You publish one Callverted number. Every call rings your existing phones first, so nothing changes for the work you already catch." },
  { n: 2, icon: I.capture, t: "Callverted captures the rest.", d: "Missed, after-hours, and overflow calls, the calls your team answers, and every website inquiry." },
  { n: 3, icon: I.sort, t: "It sorts and scores.", d: "Each one becomes a qualified job, a tidy message, or a screened non-lead. Real jobs get scored by urgency and value." },
  { n: 4, icon: I.rank, t: "Your team gets a ranked list.", d: "Callback-ready lead packets, highest-priority job at the top, so you call the money back first." },
];

// ── Section 7: Built for your trade — one scenario each ───────────────────────
const TRADES = [
  { name: "Restoration", img: "/industries/restoration.jpg", body: "Water loss, fire damage, mold, and emergency mitigation, captured with the details that determine urgency." },
  { name: "HVAC", img: "/industries/hvac.jpg", body: "No-heat and no-cool emergencies, system age, and repair-vs-replacement, so the $9k system doesn't get booked like a tune-up." },
  { name: "Plumbing", img: "/industries/plumbing.jpg", body: "Burst lines, sewage backups, and no-water calls, captured with shutoff status and what's flooding, so you know what to roll and how fast." },
  { name: "Electrical", img: "/industries/electrical.jpg", body: "Burning smells, dead panels, and no-power calls, flagged as hazards and routed to your on-call instead of parked until morning." },
];

// ── Section 9: done-with-you risk-reversal bullets ────────────────────────────
const DONE_WITH_YOU = [
  "We build your call flow and lead sources with you.",
  "You approve every service, price, and question before launch.",
  "We run test calls together before a customer ever hears it.",
  "A real person helps you tune it after launch.",
  "No contracts. Cancel anytime. It should pay for itself on one recovered job.",
];

// ── Section 10: FAQ — the 7 new category-clarifying questions ──────────────────
const FAQS_V7 = [
  { q: "Is this an AI receptionist?", a: "No. An answering service takes a message. Callverted captures the opportunity, sorts a real job from a message, scores and ranks the jobs, and tells your team who to call back first. It captures calls and website inquiries, not just missed calls." },
  { q: "Does it replace my phone number?", a: "No. You publish a Callverted number that rings your team first on every call. It only steps in when nobody picks up." },
  { q: "Does it handle website leads too?", a: "Yes. Add the widget or share your intake link. Those go through the same qualification, scoring, and sorting as phone calls." },
  { q: "What about the calls my team answers?", a: "Switch on capture and the calls your team takes get transcribed, summarized, and scored too, so the details stop living in someone's head. The audio is deleted once transcribed, never stored." },
  { q: "Will the AI answer questions or book appointments?", a: "No, and that's on purpose. It captures, it does not improvise. Callers only hear pricing you approved, word for word. If there's no approved answer, it says your team will follow up." },
  { q: "What happens on an emergency?", a: "It separates a true emergency from a routine ask, flags it, and alerts your on-call instead of parking it until morning." },
  { q: "How fast can we launch?", a: "About 30 minutes of setup: call flow, service area, pricing rules, and test calls. We walk through it with you." },
];

// ── Section 11: closing-CTA lead-alert chips (fictional, locally-hosted avatars) ──
const CTA_ALERTS: { tier: "front" | "bg"; cls: string; text: string; img?: string }[] = [
  { tier: "bg", text: "New lead · $2,100", cls: "top-[9%] right-[40%]" },
  { tier: "bg", text: "New lead · $8,900", cls: "bottom-[8%] right-[34%]" },
  { tier: "front", text: "New lead · $11,800", img: "/avatars/lead-1.jpg", cls: "top-[1%] right-[-16%]" },
  { tier: "front", text: "New lead · $9,200", img: "/avatars/lead-2.jpg", cls: "top-[25%] right-[6%]" },
  { tier: "front", text: "New lead · $6,400", img: "/avatars/lead-3.jpg", cls: "top-[50%] right-[26%]" },
  { tier: "front", text: "New lead · $3,750", img: "/avatars/lead-4.jpg", cls: "bottom-[3%] right-[10%]" },
];

export default function V7Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v7logoNav" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#how" className="text-white/90 hover:text-white font-medium transition-colors hidden md:block">How it works</a>
          <a href="#see" className="text-white/90 hover:text-white font-medium transition-colors hidden lg:block">See it work</a>
          <a href="#pricing" className="text-white/90 hover:text-white font-medium transition-colors hidden sm:block">Pricing</a>
          <BookDemo className="font-medium text-white/90 hover:text-white transition-colors hidden md:block">Book a demo</BookDemo>
          <AuthAwareNavCta />
        </div>
      </LandingNavShell>

      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <V7HeroScenesProvider tone="medium">
        <section className="relative flex items-center overflow-hidden">
          <V7HeroBackdrop />
          <div className="relative max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-10 items-center pt-32 pb-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-white mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-landing-primary-glow" /> Lead recovery for home-service trades
              </span>
              <h1 className="font-cv-heading text-[52px] sm:text-[72px] font-bold leading-[0.95] tracking-[-0.035em] mb-6 text-white">
                Stop losing jobs.
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                Capture every inbound opportunity—from missed calls, answered calls, and website inquiries. Every
                opportunity is documented, qualified, and prioritized, so your team knows exactly who to call back
                first.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Link href="/sign-up" className="text-center font-semibold bg-landing-primary text-white px-7 py-3.5 rounded-xl hover:bg-blue-600 transition-colors shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)]">Start recovering leads</Link>
                <BookDemo className="text-center font-medium text-white bg-white/10 backdrop-blur border border-white/20 px-7 py-3.5 rounded-xl hover:bg-white/20 transition-colors">Book a demo</BookDemo>
              </div>
              <p className="text-[12.5px] text-white/55 font-medium">14-day free trial · your team gets the call first · no per-lead fees</p>
            </div>
            <div className="hidden lg:flex justify-end"><V7HeroSceneCard /></div>
          </div>
        </section>
      </V7HeroScenesProvider>

      {/* ── 2. The Leak ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">The leak</Eyebrow>
            <h2 className="font-cv-heading text-4xl sm:text-[52px] font-bold tracking-[-0.035em] leading-[1.02] mb-4">There&apos;s more than one way to lose a job.</h2>
            <p className="text-[16px] text-[#667085] leading-relaxed">Every inbound opportunity that goes uncaptured, undocumented, or unprioritized is a job your competitor can win.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {LEAKS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 110} className="relative h-[440px] overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,14,28,0.9) 0%, rgba(9,14,28,0.62) 30%, rgba(9,14,28,0.5) 55%, rgba(9,14,28,0.76) 100%)" }} aria-hidden />
                <div className="relative h-full flex flex-col p-6">
                  <h3 className="font-cv-heading text-[22px] font-bold text-white leading-snug mb-2 max-w-[16ch]">{p.title}</h3>
                  <p className="text-[13.5px] text-white/85 leading-relaxed max-w-[32ch]">{p.body}</p>
                  <div className="mt-auto">
                    <LeakChipTag chip={p.chip} />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. How It Works ─────────────────────────────────────────────── */}
      <section id="how" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">How it works</Eyebrow>
            <h2 className="font-cv-heading text-4xl sm:text-[48px] font-bold tracking-[-0.035em] leading-[1.03] mb-4">Every way in. One ranked list out.</h2>
            <p className="text-[16px] text-[#667085] leading-relaxed">One system on your phone line and your website makes sure nothing that comes in gets lost.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-14">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-3xl border border-[#e3e7ed] bg-white p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-landing-primary/10 text-landing-primary">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={s.icon} /></svg>
                  </span>
                  <span className="font-cv-heading text-[15px] font-black text-[#d7deea]">0{s.n}</span>
                </div>
                <h3 className="font-cv-heading text-[16px] font-bold mb-1.5 leading-snug">{s.t}</h3>
                <p className="text-[13.5px] text-[#667085] leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>

          <div className="mb-6">
            <h3 className="font-cv-heading text-2xl sm:text-3xl font-bold tracking-[-0.03em] mb-1.5">One sentence in. The facts out.</h3>
            <p className="text-[14.5px] text-[#667085] max-w-xl">Not a rigid form. Not an open chatbot. It uses what the caller already said, and asks only for what&apos;s missing.</p>
          </div>
          <V7ExtractionDemo />
        </ScrollReveal>
      </section>

      {/* ── 4. See It Work ──────────────────────────────────────────────── */}
      <section id="see" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <Eyebrow className="mb-3">See it work</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[46px] font-bold tracking-[-0.035em] mb-3">Watch a call become a ranked lead.</h2>
            <p className="text-[15.5px] text-[#667085] leading-relaxed">The caller just talks. The details appear live, the score assembles the moment they hang up, and nobody on your team typed a thing.</p>
          </div>
          <V7SeeItWork />

          <div className="mt-14 mb-4 max-w-2xl">
            <p className="text-[14.5px] text-[#667085]">Every opportunity lands in one place, highest priority first.</p>
          </div>
          <V7BrowserFrame className="max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/product/dashboard.png"
              alt="Callverted dashboard showing captured opportunity value and a ranked list of priority leads"
              width={2048}
              height={1392}
              className="w-full h-auto"
            />
          </V7BrowserFrame>
        </ScrollReveal>
      </section>

      {/* ── 5. Jobs vs Messages ─────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <h2 className="font-cv-heading text-3xl sm:text-[46px] font-bold tracking-[-0.035em] mb-2">Not every call is a job.</h2>
            <p className="text-[17px] text-[#667085]">Callverted knows the difference.</p>
          </div>
          <V7JobsVsMessages />
          <p className="mt-6 text-[14.5px] font-medium text-[#475467]">A scored job or a tidy message—never a pile of voicemails.</p>
        </ScrollReveal>
      </section>

      {/* ── 6. Hear It ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-2xl mx-auto text-center">
          <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold tracking-[-0.035em] mb-3">Hear what your customer hears.</h2>
          <p className="text-[15.5px] text-[#667085] leading-relaxed mb-8">Press play. This is the intake, start to finish. No hold music, no voicemail, no menu.</p>
          <div className="text-left">
            <V7AudioSlot
              title="Sample intake call"
              note="A real recording is on the way. This is the player it ships in."
              duration="0:42"
              prompt="Full recovered-call intake: greeting, the caller's problem, the few follow-up questions, and the wrap-up."
            />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 7. Built for your trade ─────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">Built for your trade</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[46px] font-bold tracking-[-0.035em] mb-3">It knows what your trade&apos;s calls sound like.</h2>
            <p className="text-[15.5px] text-[#667085] leading-relaxed">The questions it asks and the way it scores change by trade. Here&apos;s a real scenario from each.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {TRADES.map((t, i) => (
              <ScrollReveal key={t.name} delay={(i % 2) * 90} className="overflow-hidden rounded-3xl border border-[#e3e7ed] bg-white">
                <div className="grid grid-cols-1 sm:grid-cols-[0.85fr_1.15fr]">
                  <div className="relative h-40 sm:h-full min-h-[150px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.img} alt={t.name} className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/60 via-black/10 to-transparent" aria-hidden />
                    <span className="absolute bottom-3 left-4 font-cv-heading text-[17px] font-bold text-white drop-shadow-sm">{t.name}</span>
                  </div>
                  <div className="p-5 sm:p-6">
                    <p className="text-[14px] text-[#475467] leading-relaxed">{t.body}</p>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. The math (ROI) ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <Eyebrow className="mb-3">The math</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold tracking-[-0.035em] text-[#152033] mb-4 leading-[1.03]">
              The leak is already costing you.
            </h2>
            <p className="text-[#667085] text-[15px] leading-relaxed max-w-md">
              The question isn&apos;t what Callverted costs. It&apos;s what missed and mishandled opportunities are
              already costing you.
            </p>
            <p className="mt-4 text-[13px] text-[#98a2b3] leading-relaxed max-w-md">
              Drag the inputs to your own numbers. It sizes the cost of the leak, not a promise that every opportunity
              converts.
            </p>
          </div>
          <div className="border border-white/10 bg-landing-ink rounded-[24px] p-6 sm:p-7 shadow-[0_40px_90px_-40px_rgba(16,24,40,0.5)]">
            <V7LeakCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 9. Pricing + done-with-you ──────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-12 items-center">
          <div>
            <Eyebrow className="mb-3">Pricing</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold tracking-[-0.035em] mb-4 leading-[1.03]">One flat price. Everything included.</h2>
            <p className="text-[15px] text-[#667085] leading-relaxed mb-8 max-w-md">
              Missed-call answering, answered-call capture, website intake, lead scoring and sorting, alerts, and weekly
              reports. No per-call or per-lead fees.
            </p>
            <ul className="space-y-3.5">
              {DONE_WITH_YOU.map((b) => (
                <li key={b} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <span className="text-[14.5px] text-[#344054] leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="max-w-md w-full mx-auto">
            <V7PricingCard />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 10. FAQ ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <Eyebrow className="mb-3">FAQ</Eyebrow>
            <h2 className="font-cv-heading text-2xl sm:text-3xl font-bold tracking-[-0.035em]">Questions owners ask first</h2>
          </div>
          <div className="rounded-2xl border border-[#e3e7ed] bg-white overflow-hidden">
            {FAQS_V7.map((faq, i) => (
              <details key={faq.q} className={`group ${i > 0 ? "border-t border-[#e3e7ed]" : ""} [&_summary::-webkit-details-marker]:hidden`}>
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-bold px-5 py-4.5">
                  {faq.q}
                  <svg className="w-4 h-4 shrink-0 text-[#98a2b3] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </summary>
                <p className="px-5 pb-4.5 text-sm text-[#667085] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── 11. Closing CTA ─────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl px-8 sm:px-10 py-14 sm:py-16 text-white shadow-[0_30px_60px_-24px_rgba(28,63,168,0.5)]" style={{ background: "linear-gradient(135deg, #2a5ae0 0%, #1c3fa8 55%, #16307e 100%)" }}>
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,470px)_1fr]">
              <div className="relative z-10 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em] mb-4 leading-[1.05]">Stop losing jobs.</h2>
                <p className="text-white/70 mb-8 text-[15px]">Give your team the first ring. Callverted captures, sorts, and ranks the rest.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/sign-up" className="text-center font-semibold bg-white text-landing-primary px-6 py-3.5 rounded-xl hover:bg-[#f0f4ff] transition-colors shadow-lg whitespace-nowrap">Start recovering leads</Link>
                  <BookDemo className="text-center font-semibold text-white bg-white/10 border border-white/40 px-6 py-3.5 rounded-xl hover:bg-white/20 transition-colors whitespace-nowrap">Book a 15-min demo</BookDemo>
                </div>
                <p className="mt-5 text-[12.5px] text-white/60">14-day free trial · your team gets the call first · no per-lead fees</p>
              </div>
              <div className="relative hidden lg:block h-[360px]" aria-hidden>
                {CTA_ALERTS.map((a, i) => {
                  const front = a.tier === "front";
                  return (
                    <div key={i} className={`absolute ${a.cls} ${front ? "z-10" : "z-0 opacity-45 blur-[3px]"}`}>
                      <div className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 ${front ? "bg-white/[0.17] border border-white/25 shadow-[0_18px_36px_-16px_rgba(0,0,0,0.55)]" : "bg-white/[0.10] border border-white/10"}`}>
                        {front && a.img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.img} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/30" />
                        ) : (
                          <span className="h-9 w-9 shrink-0 rounded-full bg-white/25" />
                        )}
                        <span className="text-[15px] font-semibold whitespace-nowrap">{a.text}</span>
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
      <JsonLd data={faqSchema(FAQS_V7)} />

      {/* ── Corner CTA — opens the book-a-demo / lead-capture modal ─────── */}
      <BookDemo
        title="Questions before you start?"
        blurb="Book a quick call or leave your details — a real person (not a bot) will get back to you, usually same day."
        className="fixed bottom-5 right-5 z-50 hidden sm:flex items-center gap-2.5 rounded-full bg-landing-primary text-white pl-4 pr-5 py-3 shadow-[0_12px_30px_-8px_rgba(36,84,216,0.6)] hover:bg-blue-600 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={I.chat} /></svg>
        <span className="text-sm font-semibold">Questions? Talk to us</span>
      </BookDemo>
    </div>
  );
}
