import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { JsonLd } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { V9LeakCalculator } from "@/components/marketing/v9/V9LeakCalculator";
import { V9PricingCard } from "@/components/marketing/v9/V9PricingCard";
import { V9SeeItWork } from "@/components/marketing/v9/V9SeeItWork";

/**
 * /v9 — "Blunt Simplicity" landing (throwaway, noindex).
 *
 * A distinct thesis from v5–v8: Leaddi-level bluntness. The copy hierarchy is
 * simpler and blunter — short declarative lines stacked vertically are the
 * signature typographic move — on a predominantly light, high-contrast,
 * typographic page with ONE accent color and generous whitespace. One strong
 * visual anchor: the demo, placed in the single dark accent band.
 *
 * Copy is verbatim from docs/landing-v9-simple-spec.md. Section spine (8 + close):
 * Hero → Problem → Mechanism → Demo → Differentiator → Trades → ROI → Pricing
 * → closing CTA. NO Hear-It section and NO FAQ, by design. Every page-body piece
 * is page-scoped under components/marketing/v9/ so /v9 iterates independently.
 */

export const metadata: Metadata = {
  title: "Callverted | Stop Losing Jobs",
  robots: { index: false, follow: false },
};

const TRUST_LINE = "14-day free trial · your team gets the call first · no per-lead fees";

const HERO_SUBHEAD =
  "Callverted captures missed calls, answered calls, and website inquiries, then turns the real opportunities into a ranked callback list.";

// ── §6 Trades — compact four-tile row ────────────────────────────────────────
const TRADES = [
  { name: "Restoration", img: "/industries/restoration.jpg" },
  { name: "HVAC", img: "/industries/hvac.jpg" },
  { name: "Plumbing", img: "/industries/plumbing.jpg" },
  { name: "Electrical", img: "/industries/electrical.jpg" },
];

// ── §5 Differentiator — three contrasting outcome lines ──────────────────────
const OUTCOMES: { text: string; tag: string; tone: "job" | "message" | "screened" }[] = [
  { text: "A burst water heater is a job.", tag: "Job", tone: "job" },
  { text: "A billing question is a message.", tag: "Message", tone: "message" },
  { text: "A wrong number is screened.", tag: "Screened", tone: "screened" },
];

const OUTCOME_TONE: Record<"job" | "message" | "screened", string> = {
  job: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  message: "bg-blue-50 text-landing-primary ring-landing-primary/20",
  screened: "bg-[#f2f4f7] text-[#98a2b3] ring-black/[0.06]",
};

function Eyebrow({ children, dark = false }: { children: React.ReactNode; dark?: boolean }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-[0.18em] ${dark ? "text-landing-primary-glow" : "text-landing-primary"}`}>
      {children}
    </p>
  );
}

// The signature move: short declarative lines stacked with thin rules between them.
function StackedLines({ lines }: { lines: string[] }) {
  return (
    <div className="divide-y divide-[#e3e7ed] border-y border-[#e3e7ed]">
      {lines.map((line, i) => (
        <ScrollReveal key={line} delay={i * 90} className="flex items-baseline gap-5 py-6 sm:py-7">
          <span className="font-cv-mono shrink-0 text-[13px] font-bold text-[#c1c8d3]">0{i + 1}</span>
          <p className="font-cv-heading text-[24px] font-bold leading-[1.1] tracking-[-0.02em] text-[#152033] sm:text-[32px]">
            {line}
          </p>
        </ScrollReveal>
      ))}
    </div>
  );
}

export default function V9Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v9logo" />
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

      {/* ── 1 · Hero — left-aligned, blunt headline + one lean ranked card ── */}
      <section className="relative overflow-hidden bg-white px-6 pt-32 pb-16 sm:pb-24">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px]"
          aria-hidden
          style={{ background: "radial-gradient(60% 55% at 15% 0%, rgba(36,84,216,0.08) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <ScrollReveal>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e3e7ed] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />
              Lead recovery for home-service trades
            </span>
            <h1 className="font-cv-heading mb-5 text-[52px] font-bold leading-[0.98] tracking-[-0.04em] sm:text-[76px]">
              Stop losing jobs.
            </h1>
            <p className="mb-8 max-w-xl text-[18px] leading-relaxed text-[#667085]">{HERO_SUBHEAD}</p>
            <div className="mb-5 flex flex-col gap-3 sm:flex-row">
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

          {/* Lean hero visual: one ranked "next callback" card, restrained. */}
          <ScrollReveal delay={140} className="relative">
            <div className="mx-auto max-w-sm rounded-3xl border border-[#e3e7ed] bg-white p-6 shadow-[0_40px_90px_-40px_rgba(16,24,40,0.45)]">
              <div className="mb-4 flex items-center justify-between">
                <p className="font-cv-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-landing-primary">Ranked callback list</p>
                <span className="font-cv-mono text-[11px] font-semibold text-[#98a2b3]">4 in queue</span>
              </div>

              {/* Top job — the money callback, first */}
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <div className="mb-2.5 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                    Hot
                  </span>
                  <span className="flex items-baseline gap-1">
                    <span className="font-cv-heading text-[26px] font-black leading-none text-amber-600">92</span>
                    <span className="font-cv-mono text-[9px] font-bold uppercase tracking-[0.14em] text-[#98a2b3]">score</span>
                  </span>
                </div>
                <p className="font-cv-heading text-[16px] font-bold leading-tight text-[#152033]">Water heater burst · flooding</p>
                <p className="mt-1 text-[12.5px] text-[#667085]">Emergency · ZIP 33618 · est. $1.8k–$3.2k</p>
                <div className="mt-3 flex items-center gap-2 border-t border-amber-200/70 pt-3">
                  <span className="grid h-6 w-6 place-items-center rounded-full bg-amber-500 text-white">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" /></svg>
                  </span>
                  <span className="font-cv-heading text-[14px] font-bold text-amber-700">Call back now</span>
                </div>
              </div>

              {/* Two dimmed lower entries — conveys the "ranked list" without crowding */}
              <div className="mt-3 space-y-2">
                {[
                  { tier: "Warm", dot: "bg-sky-400", txt: "AC no-cool · this week", val: "$540" },
                  { tier: "Cool", dot: "bg-slate-300", txt: "Faucet drip · flexible", val: "$180" },
                ].map((r) => (
                  <div key={r.txt} className="flex items-center gap-3 rounded-xl border border-[#eef1f4] bg-[#f9fafb] px-3.5 py-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#475467]">{r.txt}</span>
                    <span className="font-cv-mono shrink-0 text-[12px] font-semibold text-[#98a2b3]">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 2 · Problem — text-forward stacked lines ─────────────────────── */}
      <section className="border-t border-[#e3e7ed] bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal className="mb-10 max-w-2xl">
            <Eyebrow>The leak</Eyebrow>
            <h2 className="font-cv-heading mt-3 text-[34px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[48px]">
              Good jobs are leaking before your team can call back.
            </h2>
          </ScrollReveal>
          <StackedLines
            lines={[
              "Some calls get missed.",
              "Some details never get written down.",
              "Some high-value jobs wait behind low-value callbacks.",
            ]}
          />
          <ScrollReveal delay={120} className="mt-10 max-w-2xl">
            <p className="text-[17px] leading-relaxed text-[#667085]">
              Callverted catches the opportunity, documents the details, and shows your team who to call first.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 3 · Mechanism — many ways in, one ranked list out ────────────── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-5xl">
          <ScrollReveal className="mb-12 text-center">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="font-cv-heading mx-auto mt-3 max-w-2xl text-[32px] font-bold leading-[1.03] tracking-[-0.035em] sm:text-[46px]">
              Many ways in. One ranked list out.
            </h2>
          </ScrollReveal>

          <ScrollReveal className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_auto_1fr]">
            {/* Three inputs */}
            <div className="space-y-3">
              {[
                { t: "Missed call.", d: "Nobody free, or after hours." },
                { t: "Answered call.", d: "Your team picks up." },
                { t: "Website inquiry.", d: "A short guided intake." },
              ].map((s) => (
                <div key={s.t} className="rounded-2xl border border-[#e3e7ed] bg-white px-5 py-4">
                  <p className="font-cv-heading text-[18px] font-bold leading-tight text-[#152033]">{s.t}</p>
                  <p className="mt-0.5 text-[13px] text-[#667085]">{s.d}</p>
                </div>
              ))}
            </div>

            {/* Converge arrow */}
            <div className="flex justify-center lg:px-2" aria-hidden>
              <span className="grid h-11 w-11 place-items-center rounded-full bg-landing-primary text-white shadow-[0_10px_28px_-10px_rgba(36,84,216,0.7)]">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="rotate-90 lg:rotate-0">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </span>
            </div>

            {/* One ranked-out card */}
            <div className="rounded-2xl border border-landing-primary/25 bg-white p-5 shadow-[0_24px_60px_-32px_rgba(36,84,216,0.4)]">
              <p className="font-cv-mono text-[10px] font-bold uppercase tracking-[0.16em] text-landing-primary">Ranked callback list</p>
              <div className="mt-3 space-y-2">
                {[
                  { dot: "bg-amber-400", txt: "Hot · Water heater burst", val: "92" },
                  { dot: "bg-sky-400", txt: "Warm · AC no-cool", val: "54" },
                  { dot: "bg-slate-300", txt: "Cool · Faucet drip", val: "21" },
                ].map((r) => (
                  <div key={r.txt} className="flex items-center gap-3 rounded-xl bg-[#f9fafb] px-3 py-2.5">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${r.dot}`} />
                    <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#344054]">{r.txt}</span>
                    <span className="font-cv-mono shrink-0 text-[12px] font-bold text-[#98a2b3]">{r.val}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={120} className="mx-auto mt-12 max-w-2xl space-y-3 text-center">
            <p className="font-cv-heading text-[19px] font-bold leading-snug text-[#152033] sm:text-[22px]">
              Each one becomes a job, a message, or a screened non-lead.
            </p>
            <p className="text-[15.5px] leading-relaxed text-[#667085]">
              Real jobs get scored by urgency and value, so the most important callback rises to the top.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4 · Demo — the ONE dark accent band ──────────────────────────── */}
      <section
        id="demo"
        className="scroll-mt-20 overflow-hidden bg-landing-ink px-6 py-20 sm:py-24"
        style={{ background: "radial-gradient(120% 80% at 50% 0%, #16223c 0%, #0a0f1c 55%, #0a0f1c 100%)" }}
      >
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-10 max-w-2xl text-center">
            <Eyebrow dark>See it work</Eyebrow>
            <h2 className="font-cv-heading mt-3 text-[32px] font-bold tracking-[-0.035em] text-white sm:text-[48px]">
              See a lead get ranked.
            </h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-white/65">
              Three ways a lead comes in. Pick one and watch it become a ranked, callback-ready job.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <V9SeeItWork />
          </ScrollReveal>

          <ScrollReveal delay={160} className="mx-auto mt-14 max-w-5xl">
            <p className="mb-4 text-center text-[13.5px] font-semibold text-white/70">Every opportunity, ranked in one place.</p>
            {/* Browser-chrome frame around the real dashboard screenshot */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-white shadow-[0_40px_90px_-40px_rgba(0,0,0,0.7)]">
              <div className="flex items-center gap-2 border-b border-[#eef1f4] bg-[#f9fafb] px-3.5 py-2.5">
                <span className="flex gap-1.5" aria-hidden>
                  <span className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
                  <span className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
                </span>
                <span className="font-cv-mono ml-2 flex-1 truncate rounded-md bg-white px-2.5 py-1 text-[10.5px] text-[#98a2b3] ring-1 ring-[#eef1f4]">
                  app.callverted.com/dashboard
                </span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/product/dashboard.png"
                alt="Callverted dashboard showing captured opportunity value, confirmed won revenue, and a ranked list of priority leads"
                width={2048}
                height={1392}
                className="h-auto w-full"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 5 · Differentiator — not every call is a job ─────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal className="mb-10 max-w-2xl">
            <Eyebrow>Jobs vs messages</Eyebrow>
            <h2 className="font-cv-heading mt-3 text-[34px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[48px]">
              Not every call is a job.
            </h2>
          </ScrollReveal>

          <div className="divide-y divide-[#e3e7ed] border-y border-[#e3e7ed]">
            {OUTCOMES.map((o, i) => (
              <ScrollReveal key={o.text} delay={i * 90} className="flex flex-wrap items-center justify-between gap-4 py-6 sm:py-7">
                <p className="font-cv-heading text-[22px] font-bold leading-tight tracking-[-0.02em] text-[#152033] sm:text-[30px]">
                  {o.text}
                </p>
                <span className={`inline-flex items-center rounded-full px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-wide ring-1 ${OUTCOME_TONE[o.tone]}`}>
                  {o.tag}
                </span>
              </ScrollReveal>
            ))}
          </div>

          <ScrollReveal delay={120} className="mt-10">
            <p className="font-cv-heading text-[20px] font-bold leading-snug text-[#152033] sm:text-[24px]">
              Callverted knows the difference.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 6 · Trades — lean four-tile row ──────────────────────────────── */}
      <section id="trades" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-12 max-w-2xl">
            <Eyebrow>Built for your trade</Eyebrow>
            <h2 className="font-cv-heading mt-3 text-[32px] font-bold leading-[1.03] tracking-[-0.035em] sm:text-[46px]">
              Built around the calls your trade actually gets.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-[#667085]">
              Restoration, HVAC, plumbing, and electrical calls are not all the same. Callverted asks different questions and scores different signals based on the work you do.
            </p>
          </ScrollReveal>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {TRADES.map((t, i) => (
              <ScrollReveal key={t.name} delay={(i % 4) * 80} className="relative h-44 overflow-hidden rounded-2xl border border-[#e3e7ed] sm:h-52">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.name} className="absolute inset-0 h-full w-full object-cover object-[50%_35%]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent px-4 pb-3.5 pt-10">
                  <span className="font-cv-heading text-[16px] font-bold text-white drop-shadow-sm">{t.name}</span>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 7 · ROI — the leak calculator ────────────────────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow>The math</Eyebrow>
            <h2 className="font-cv-heading mt-3 text-[32px] font-bold leading-[1.03] tracking-[-0.035em] sm:text-[46px]">
              The leak is already costing you.
            </h2>
            <p className="mt-4 max-w-md text-[16px] leading-relaxed text-[#667085]">
              Estimate how many opportunities you lose or delay each month, and see how many recovered jobs it takes to cover Callverted.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-landing-ink p-6 shadow-[0_40px_90px_-40px_rgba(16,24,40,0.5)] sm:p-7">
            <V9LeakCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 8 · Pricing — one dominant, lean card ────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-lg">
          <ScrollReveal className="mb-8 text-center">
            <Eyebrow>Pricing</Eyebrow>
            <h2 className="font-cv-heading mt-3 text-[32px] font-bold tracking-[-0.035em] sm:text-[44px]">
              One flat price. Everything included.
            </h2>
          </ScrollReveal>
          <ScrollReveal delay={100}>
            <V9PricingCard />
          </ScrollReveal>
        </div>
      </section>

      {/* ── Closing CTA — minimal single band (bookends the hero) ─────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-5xl">
          <div
            className="overflow-hidden rounded-3xl px-8 py-14 text-center text-white shadow-[0_30px_60px_-24px_rgba(28,63,168,0.5)] sm:px-10 sm:py-16"
            style={{ background: "linear-gradient(135deg, #2a5ae0 0%, #1c3fa8 55%, #16307e 100%)" }}
          >
            <h2 className="font-cv-heading mb-6 text-[36px] font-bold leading-[1.02] tracking-[-0.035em] sm:text-[52px]">
              Stop losing jobs.
            </h2>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="whitespace-nowrap rounded-xl bg-white px-7 py-3.5 text-center font-semibold text-landing-primary shadow-lg transition-colors hover:bg-[#f0f4ff]"
              >
                Start recovering leads
              </Link>
              <BookDemo className="whitespace-nowrap rounded-xl border border-white/40 bg-white/10 px-7 py-3.5 text-center font-semibold text-white transition-colors hover:bg-white/20">
                Book a demo
              </BookDemo>
            </div>
            <p className="mt-6 text-[12.5px] text-white/70">{TRUST_LINE}</p>
          </div>
        </ScrollReveal>
      </section>

      <MarketingFooter />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Product",
          name: "Callverted",
          description:
            "Inbound lead recovery for home-service trades. Callverted captures missed calls, answered calls, and website inquiries, then ranks the real opportunities into a callback list.",
          brand: { "@type": "Brand", name: "Callverted" },
          offers: {
            "@type": "Offer",
            price: "149",
            priceCurrency: "USD",
            url: "https://callverted.com",
          },
        }}
      />
    </div>
  );
}
