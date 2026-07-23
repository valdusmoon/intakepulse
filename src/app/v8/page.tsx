import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { V8HeroScenesProvider, V8HeroBackdrop, V8HeroSceneCard } from "@/components/marketing/v8/V8HeroScenes";
import { V8JobsVsMessages } from "@/components/marketing/v8/V8JobsVsMessages";
import { V8LeakCalculator } from "@/components/marketing/v8/V8LeakCalculator";
import { BrowserFrame, V8WaveformPlayer } from "@/components/marketing/v8/V8MediaSlot";
import { V8PricingCard } from "@/components/marketing/v8/V8PricingCard";
import { V8SeeItWork } from "@/components/marketing/v8/V8SeeItWork";
import { V8TradeShowcase } from "@/components/marketing/v8/V8TradeShowcase";

/**
 * /v8 — the "hybrid" landing draft (throwaway, noindex).
 *
 * Combines v6's dark split-hero story spine, v7's polished enterprise visual
 * system, and v5's copy restraint. Copy follows docs/landing-v8-hybrid-spec.md
 * (sections 1–12) verbatim. Every body component is page-scoped under
 * src/components/marketing/v8/ (the See It Work demo is owned by a sibling agent
 * and imported, never edited here).
 *
 * Section arc: Nav → Hero → The Leak → How It Works → See It Work →
 * Jobs vs Messages → Hear It → Built for your trade → The Math → Pricing →
 * FAQ → Closing CTA. Dark/light rhythm: dark hero · gray leak · white how ·
 * DARK see-it-work · tinted jobs · white hear · DARK trade · gray math ·
 * white pricing · gray FAQ · DARK closing.
 */

export const metadata: Metadata = {
  title: "Callverted | Stop Losing Jobs",
  robots: { index: false, follow: false },
};

const CHAT_ICON = "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z";

function Eyebrow({ children, className = "", dark = false }: { children: React.ReactNode; className?: string; dark?: boolean }) {
  return (
    <p className={`font-cv-mono text-xs font-bold uppercase tracking-widest ${dark ? "text-landing-primary-glow" : "text-landing-primary"} ${className}`}>
      {children}
    </p>
  );
}

// ── Section 3: The Leak ───────────────────────────────────────────────────────
const PAINS = [
  {
    img: "/pain/busy.jpg",
    title: "The call rings out.",
    body: "Nobody is free, or it is after hours. The caller does not leave a voicemail and calls the next company.",
    chip: "Missed · on a job",
  },
  {
    img: "/pain/afterhours.jpg",
    title: "The details never get written down.",
    body: "The call your team answered, or the web inquiry nobody worked, lives in someone's memory until it disappears.",
    chip: "Web lead · never worked",
  },
  {
    img: "/pain/nextcompany.jpg",
    title: "The big job waits behind the small one.",
    body: "Five callbacks sit in one queue with no way to distinguish the emergency from the tune-up.",
    chip: "Hot lead · called back 4th",
  },
];

// ── Section 4: How It Works (four CONNECTED steps) ────────────────────────────
const STEPS = [
  { t: "Your team gets the call first.", d: "Every call rings your existing phones first." },
  { t: "Callverted captures the rest.", d: "It handles missed and overflow calls, captures the calls your team answers, and collects website inquiries." },
  { t: "It sorts and scores.", d: "Every intake becomes a qualified job, a documented message, or a screened non-lead. Jobs are scored by urgency and value." },
  { t: "Your team gets a ranked list.", d: "The highest-priority job appears at the top with everything needed for the callback." },
];

// ── Section 10: "We set it up with you" panel (7 bullets, verbatim) ────────────
const SET_UP = [
  "We build the call flow and lead sources with you.",
  "You approve every service, price, and question.",
  "We run test calls together before launch.",
  "A real person helps you tune it after launch.",
  "No contracts.",
  "Cancel anytime.",
  "One recovered job can cover the cost.",
];

// ── Section 11: FAQ (category-clarifying, tightened locked answers) ────────────
const FAQ_V8 = [
  { q: "Is this an AI receptionist?", a: "No. An answering service takes a message. Callverted captures the opportunity, sorts a real job from a message, scores and ranks the jobs, and tells your team who to call back first. It captures calls and website inquiries, not just missed calls." },
  { q: "Does it replace my phone number?", a: "No. You publish a Callverted number that rings your team first on every call. It only steps in when nobody picks up." },
  { q: "Does it handle website leads?", a: "Yes. Add the widget or share your intake link. Those go through the same qualification, scoring, and sorting as phone calls." },
  { q: "What happens to calls my team answers?", a: "Switch on capture and the calls your team takes get transcribed, summarized, and scored too, so the details stop living in someone's head. The audio is deleted once transcribed, never stored." },
  { q: "Can it answer questions or book appointments?", a: "No, and that is on purpose. It captures, it does not improvise. Callers only hear pricing you approved, word for word. If there is no approved answer, it says your team will follow up." },
  { q: "What happens during an emergency?", a: "It separates a true emergency from a routine ask, flags it, and alerts your on-call instead of parking it until morning." },
  { q: "How fast can we launch?", a: "About 30 minutes of setup: call flow, service area, pricing rules, and test calls. We walk through it with you." },
];

// ── Section 12: closing lead alerts (only THREE, per spec) ────────────────────
const CTA_ALERTS: { text: string; img: string; cls: string }[] = [
  { text: "New lead · $8,900", img: "/avatars/lead-1.jpg", cls: "top-[6%] right-[4%]" },
  { text: "New lead · $3,750", img: "/avatars/lead-2.jpg", cls: "top-[44%] right-[16%]" },
  { text: "New lead · $2,100", img: "/avatars/lead-3.jpg", cls: "bottom-[8%] right-[6%]" },
];

export default function V8Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      {/* ── 1. Nav (dark) ───────────────────────────────────────────────── */}
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v8logoNav" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#how" className="hidden font-medium text-white/90 transition-colors hover:text-white md:block">How it works</a>
          <a href="#see" className="hidden font-medium text-white/90 transition-colors hover:text-white lg:block">See it work</a>
          <a href="#trades" className="hidden font-medium text-white/90 transition-colors hover:text-white lg:block">Trades</a>
          <a href="#pricing" className="hidden font-medium text-white/90 transition-colors hover:text-white sm:block">Pricing</a>
          <BookDemo className="hidden font-medium text-white/90 transition-colors hover:text-white md:block">Book a demo</BookDemo>
          <AuthAwareNavCta />
        </div>
      </LandingNavShell>

      {/* ── 2. Hero (dark split, rotating source + fixed packet + trade photos) ── */}
      <V8HeroScenesProvider>
        <section className="relative flex items-center overflow-hidden">
          <V8HeroBackdrop />
          <div className="relative mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-12 px-6 pb-20 pt-32 lg:grid-cols-[1fr_0.95fr] lg:gap-10">
            <div>
              <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-landing-primary-glow" /> Lead recovery for home-service trades
              </span>
              <h1 className="font-cv-heading mb-6 text-[52px] font-bold leading-[0.95] tracking-[-0.035em] text-white sm:text-[72px]">
                Stop losing jobs.
              </h1>
              <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/70">
                Capture every inbound opportunity from missed calls, answered calls, and website inquiries. Callverted
                documents, qualifies, and prioritizes each one, so your team knows exactly who to call back first.
              </p>
              <div className="mb-4 flex flex-col gap-3 sm:flex-row">
                <Link href="/sign-up" className="rounded-xl bg-landing-primary px-7 py-3.5 text-center font-semibold text-white shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)] transition-colors hover:bg-blue-600">
                  Start recovering leads
                </Link>
                <BookDemo className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-center font-medium text-white backdrop-blur transition-colors hover:bg-white/20">
                  Book a demo
                </BookDemo>
              </div>
              <p className="text-[12.5px] font-medium text-white/55">14-day free trial · your team gets the call first · no per-lead fees</p>
            </div>
            <div className="flex justify-center lg:justify-end">
              <V8HeroSceneCard />
            </div>
          </div>
        </section>
      </V8HeroScenesProvider>

      {/* ── 3. The Leak (light gray) ────────────────────────────────────── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-12 max-w-2xl">
            <Eyebrow className="mb-3">The Leak</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-4xl font-bold leading-[1.02] tracking-[-0.035em] sm:text-[52px]">There&apos;s more than one way to lose a job.</h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">Every inbound opportunity that goes uncaptured, undocumented, or unprioritized is a job your competitor can win.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {PAINS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 110} className="relative h-[420px] overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,14,28,0.9) 0%, rgba(9,14,28,0.62) 30%, rgba(9,14,28,0.5) 55%, rgba(9,14,28,0.78) 100%)" }} aria-hidden />
                <div className="relative flex h-full flex-col p-6">
                  <h3 className="font-cv-heading mb-2 max-w-[16ch] text-[22px] font-bold leading-snug text-white">{p.title}</h3>
                  <p className="max-w-[32ch] text-[13.5px] leading-relaxed text-white/85">{p.body}</p>
                  <div className="mt-auto">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/92 px-3.5 py-2 font-cv-mono text-[12px] font-bold text-[#0f141e] shadow-[0_16px_38px_-12px_rgba(0,0,0,0.6)] ring-1 ring-black/[0.06] backdrop-blur-md">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#e5484d]" /> {p.chip}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. How It Works (white, four CONNECTED steps) ───────────────── */}
      <section id="how" className="scroll-mt-20 bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-14 max-w-2xl">
            <Eyebrow className="mb-3">How It Works</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-4xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[46px]">Every way in. One ranked list out.</h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">One system on your phone line and website makes sure nothing that comes in gets lost.</p>
          </ScrollReveal>

          <ScrollReveal>
            <ol className="relative grid grid-cols-1 gap-8 lg:grid-cols-4 lg:gap-6">
              {/* desktop connecting line through the node centers */}
              <span aria-hidden className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-7 hidden h-0.5 lg:block" style={{ background: "linear-gradient(90deg, rgba(36,84,216,0.35), rgba(36,84,216,0.35) 70%, rgba(36,84,216,0.12))" }} />
              {/* desktop directional chevrons between nodes */}
              {[25, 50, 75].map((left) => (
                <span key={left} aria-hidden className="absolute top-[18px] hidden -translate-x-1/2 text-landing-primary/40 lg:block" style={{ left: `${left}%` }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                </span>
              ))}
              {STEPS.map((s, i) => (
                <li key={s.t} className="relative flex items-start gap-4 lg:flex-col lg:items-center lg:gap-0 lg:text-center">
                  {/* mobile vertical connector */}
                  {i < STEPS.length - 1 && (
                    <span aria-hidden className="absolute bottom-[-32px] left-[27px] top-14 w-0.5 bg-landing-primary/20 lg:hidden" />
                  )}
                  <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-2xl text-white shadow-[0_10px_26px_-10px_rgba(36,84,216,0.6)]" style={{ background: "linear-gradient(135deg,#2a5ae0 0%,#1c3fa8 55%,#16307e 100%)" }}>
                    <span className="font-cv-heading text-[17px] font-bold tabular-nums">0{i + 1}</span>
                  </span>
                  <div className="lg:mt-5 lg:px-2">
                    <h3 className="font-cv-heading mb-1.5 text-[17px] font-bold leading-snug tracking-[-0.01em]">{s.t}</h3>
                    <p className="text-[14px] leading-relaxed text-[#667085]">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5. See It Work (DARK centerpiece) ───────────────────────────── */}
      <section id="see" className="scroll-mt-20 overflow-hidden bg-landing-ink px-6 py-20 sm:py-24" style={{ background: "radial-gradient(120% 80% at 50% 0%, #16223c 0%, #0a0f1c 55%, #0a0f1c 100%)" }}>
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
            <Eyebrow dark className="mb-3">See It Work</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold tracking-[-0.035em] text-white sm:text-[46px]">Watch an opportunity become a ranked lead.</h2>
            <p className="text-[15.5px] leading-relaxed text-white/65">
              The intake changes by channel. The result does not. Every real job becomes a callback-ready packet and lands in the same ranked queue.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <V8SeeItWork />
          </ScrollReveal>

          <ScrollReveal delay={160} className="mx-auto mt-14 max-w-5xl">
            <p className="mb-4 text-center text-[13.5px] font-semibold text-white/70">Every opportunity lands in one place, highest priority first.</p>
            <BrowserFrame url="app.callverted.com/dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/product/dashboard.png" alt="Callverted dashboard showing captured opportunity value, confirmed won revenue, and a ranked list of priority leads" width={2048} height={1392} className="h-auto w-full" />
            </BrowserFrame>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6. Jobs vs Messages (light / tinted) ────────────────────────── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-[44px]">Not every call is a job.</h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">Callverted knows the difference.</p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <V8JobsVsMessages />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 7. Hear It (white, large waveform player) ───────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="mb-8 text-center">
            <Eyebrow className="mb-3">Hear It</Eyebrow>
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-[42px]">Hear what your customer hears.</h2>
            <p className="mx-auto max-w-xl text-[15.5px] leading-relaxed text-[#667085]">
              Press play to hear the intake from start to finish. No hold music, no voicemail, and no phone menu.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <V8WaveformPlayer />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 8. Built for your trade (DARK showcase) ─────────────────────── */}
      <section id="trades" className="scroll-mt-20 overflow-hidden bg-landing-ink px-6 py-20 sm:py-24" style={{ background: "radial-gradient(110% 80% at 80% 0%, #16223c 0%, #0a0f1c 55%, #0a0f1c 100%)" }}>
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-12 max-w-2xl">
            <Eyebrow dark className="mb-3">Built For Your Trade</Eyebrow>
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] text-white sm:text-[46px]">It knows what your trade&apos;s calls sound like.</h2>
            <p className="text-[15.5px] leading-relaxed text-white/65">The questions it asks and the way it scores change by trade.</p>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <V8TradeShowcase />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 9. The Math (gray, dark ROI card) ───────────────────────────── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow className="mb-3">The Math</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] text-[#152033] sm:text-[42px]">The leak is already costing you.</h2>
            <p className="max-w-md text-[15px] leading-relaxed text-[#667085]">
              The question is not what Callverted costs. It is what missed and mishandled opportunities are already costing you.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-landing-ink p-6 shadow-[0_40px_90px_-40px_rgba(16,24,40,0.5)] sm:p-7">
            <V8LeakCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 10. Pricing (white, one card + set-up panel) ────────────────── */}
      <section id="pricing" className="scroll-mt-20 bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div>
            <Eyebrow className="mb-3">Pricing</Eyebrow>
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">One flat price. Everything included.</h2>
            <p className="mb-6 max-w-md text-[14.5px] leading-relaxed text-[#667085]">
              Missed-call intake, answered-call capture, website intake, qualification and scoring, a ranked callback queue, alerts, and weekly reporting. No per-call or per-lead fees.
            </p>
            <V8PricingCard />
          </div>
          <div>
            <Eyebrow className="mb-3">We Set It Up With You</Eyebrow>
            <h3 className="font-cv-heading mb-6 text-2xl font-bold leading-[1.1] tracking-[-0.035em] sm:text-[28px]">A real person helps you launch, not just software.</h3>
            <div className="space-y-3.5">
              {SET_UP.map((t) => (
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

      {/* ── 11. FAQ (gray) ──────────────────────────────────────────────── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Eyebrow className="mb-3">FAQ</Eyebrow>
            <h2 className="font-cv-heading text-2xl font-bold tracking-[-0.035em] sm:text-3xl">Questions owners ask first</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e3e7ed] bg-white">
            {FAQ_V8.map((faq, i) => (
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

      {/* ── 12. Closing CTA (DARK, echoes the hero, THREE lead alerts) ──── */}
      <section className="relative overflow-hidden bg-landing-ink px-6 py-24 sm:py-28" style={{ background: "radial-gradient(120% 90% at 50% 0%, #16223c 0%, #0a0f1c 60%, #0a0f1c 100%)" }}>
        {/* three subtle floating lead alerts */}
        <div className="pointer-events-none absolute inset-0 hidden lg:block" aria-hidden>
          {CTA_ALERTS.map((a, i) => (
            <div key={i} className={`absolute ${a.cls}`}>
              <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 backdrop-blur">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={a.img} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-white/20" />
                <span className="whitespace-nowrap text-[14px] font-semibold text-white/85">{a.text}</span>
              </div>
            </div>
          ))}
        </div>

        <ScrollReveal className="relative mx-auto max-w-2xl text-center">
          <h2 className="font-cv-heading mb-4 text-4xl font-bold leading-[1.05] tracking-[-0.035em] text-white sm:text-5xl">Stop losing jobs.</h2>
          <p className="mx-auto mb-8 max-w-lg text-[16px] leading-relaxed text-white/70">Give your team the first ring. Callverted captures, sorts, and ranks the rest.</p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/sign-up" className="rounded-xl bg-landing-primary px-7 py-3.5 text-center font-semibold text-white shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)] transition-colors hover:bg-blue-600">Start recovering leads</Link>
            <BookDemo className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-center font-medium text-white backdrop-blur transition-colors hover:bg-white/20">Book a 15-minute demo</BookDemo>
          </div>
          <p className="mt-5 text-[12.5px] font-medium text-white/55">14-day free trial · your team gets the call first · no per-lead fees</p>
        </ScrollReveal>
      </section>

      <MarketingFooter />
      <JsonLd data={faqSchema(FAQ_V8)} />

      {/* Corner CTA — opens the book-a-demo / lead-capture modal */}
      <BookDemo
        title="Questions before you start?"
        blurb="Book a quick call or leave your details — a real person (not a bot) will get back to you, usually same day."
        className="fixed bottom-5 right-5 z-50 hidden items-center gap-2.5 rounded-full bg-landing-primary pl-4 pr-5 py-3 text-white shadow-[0_12px_30px_-8px_rgba(36,84,216,0.6)] transition-colors hover:bg-blue-600 sm:flex"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={CHAT_ICON} /></svg>
        <span className="text-sm font-semibold">Questions? Talk to us</span>
      </BookDemo>
    </div>
  );
}
