import type { Metadata } from "next";
import Link from "next/link";
import { CallvertedLogo } from "@/components/CallvertedLogo";
import { LogoMarquee } from "@/components/marketing/SocialProof";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";

// Placeholder social proof — the case-study testimonials (invented names/quotes)
// and the logo strip (invented logos) — is DISABLED until real, consented
// customer proof is ready. Kept in code; flip to true to re-enable.
const SHOW_SOCIAL_PROOF = false;
import { ExtractionDemo } from "@/components/marketing/V4Interactive";
import { HeroScenesProvider, HeroBackdrop, HeroSceneCard } from "@/components/marketing/HeroScenes";
import { BookDemo } from "@/components/marketing/BookDemo";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MissedCallCalculator } from "@/components/marketing/MissedCallCalculator";
import { PricingCard } from "@/components/marketing/PricingCard";
import { FAQS } from "@/lib/marketing/faqs";

/**
 * /v1 — "LEAD RECOVERY" POSITIONING VARIANT (throwaway, noindex). Reframes the
 * whole spine around the category word "lead recovery": the pain is that inbound
 * leads leak out across voicemail, texts, notes, and half-finished forms; the
 * mechanism is the 4-step capture → qualify → price → ranked-packet flow (with
 * caller reassurance).
 * HONESTY GUARDRAIL: "every source" means the leads that reach the business
 * DIRECTLY today — missed calls, team-answered calls, the web form, the website
 * widget. NOT third-party lead marketplaces (FB/Google/Angi), CRM imports, or
 * cold-database reactivation, which the product does not do. Widen the "sources"
 * claim only when real integrations ship. Layout/components identical to `/`.
 */

export const metadata: Metadata = {
  title: "Callverted | Lead Recovery for Home-Service Trades",
  robots: { index: false, follow: false },
};

const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL ?? "https://calendly.com/nileh/demo";

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-widest text-landing-primary ${className}`}>{children}</p>;
}

const FACTS = [
  { k: "Every source, one place", v: "Missed calls, answered calls, web", icon: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4" },
  { k: "Your team first", v: "Callverted catches what rings out", icon: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" },
  { k: "Qualified and priced", v: "From rules you approve", icon: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" },
  { k: "Nothing slips", v: "Ranked, money jobs on top", icon: "M4 6h16M4 12h10M4 18h6" },
];

// Pain cards — a real photo with HTML text over it + a floating UI chip.
const PAINS = [
  {
    img: "/pain/busy.jpg", title: "Your crew can't stop mid-job.",
    body: "Hands full on a job means the phone rings out. That's a booked job walking away.",
    chip: { kind: "call" as const, top: "Incoming call", sub: "Missed — on a job" },
  },
  {
    img: "/pain/afterhours.jpg", title: "After hours, it's just voicemail.",
    body: "Nights and weekends are when the big emergencies call, and no one's there.",
    chip: { kind: "missed" as const, top: "Missed call", sub: "11:47 PM · no voicemail" },
  },
  {
    img: "/pain/nextcompany.jpg", title: "The caller won't wait.",
    body: "Most never leave a message. They dial down the list until someone answers.",
    chip: { kind: "next" as const, top: "Calling the next company…", sub: "Your lead, gone" },
  },
];

const FIX = [
  { t: "Captured from every source", d: "Missed calls, team-answered calls, and web inquiries all land in one place, before they go cold.", icon: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4" },
  { t: "Qualified on the spot", d: "It uses what the caller already said, asks only what's missing, and scores urgency, fit, and value.", icon: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" },
  { t: "Priced from your rules", d: "The caller hears the pricing you approved, never an invented number, and gets reassured a human will confirm.", icon: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" },
  { t: "Handed over as a packet", d: "Contact, summary, quote, urgency, and the next step, ranked highest-value first.", icon: "M5 12h14M13 6l6 6-6 6" },
];

// ⚠️ FICTIONAL placeholders (reuse the invented SocialProof identities).
const CASES = [
  { img: "/casestudy/northside.jpg", tag: "Restoration", stat: "11 emergencies recovered in month one", business: "Northside Restoration", quote: "The urgent ones show up flagged, before the caller gives up and calls someone else.", who: "Renee T.", role: "Owner" },
  { img: "/casestudy/apex.jpg", tag: "HVAC", stat: "$9,200 system booked from one 2 AM call", business: "Apex HVAC & Air", quote: "It answers the calls my techs physically can't. That one job paid for the whole year.", who: "Marcus D.", role: "Owner" },
  { img: "/casestudy/blueline.jpg", tag: "Plumbing", stat: "Weekend voicemails became a ranked list", business: "BlueLine Plumbing", quote: "Monday morning I just call the money jobs back first. Setup took twenty minutes.", who: "Carlos M.", role: "Owner" },
];

const SMALL_FEATURES = [
  { kind: "context" as const, t: "Answered calls, captured too", d: "When your team picks up, the call can still be recorded, transcribed, summarized, and scored into a ranked lead." },
  { kind: "pricing" as const, t: "Approved pricing only", d: "Any quote comes from rules you set, never invented." },
  { kind: "recap" as const, t: "Weekly recovery recap", d: "What was recovered and what it was worth, every week." },
];

const COMPARE_COLS = ["Voicemail", "Missed-call text-back", "AI receptionist", "Callverted"];
const COMPARE_ROWS: { dim: string; vals: (boolean | string)[] }[] = [
  { dim: "Answers the call live", vals: [false, false, true, true] },
  { dim: "Trade-specific intake", vals: [false, "Limited", "Generic", "Tuned to you"] },
  { dim: "Catches calls + web inquiries", vals: [false, false, false, true] },
  { dim: "Scores + ranks by value", vals: [false, false, false, true] },
  { dim: "Quotes from your approved rules", vals: [false, false, false, true] },
  { dim: "Optimizes for", vals: ["Nothing", "A text thread", "Call handling", "Recovered revenue"] },
];

// Human, founder-led trust points (not enterprise compliance badges).
const TRUST = [
  { t: "We set it up with you", d: "A short call to get you live and tuned to your trade. You don't touch the tech alone.", icon: "M4 14v-1a8 8 0 0 1 16 0v1M5 14h2v5H6a2 2 0 0 1-2-2v-3zm14 0h-2v5h1a2 2 0 0 0 2-2v-3z" },
  { t: "A real person, not a ticket queue", d: "Text or call us directly whenever something comes up, before and after you start.", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" },
  { t: "You approve everything", d: "Your intake questions and pricing rules are yours to sign off. Nothing goes live without you.", icon: "M12 3l7 3v6c0 4-3 7-7 8-4-1-7-4-7-8V6l7-3zM9 12l2 2 4-4" },
  { t: "No contracts, cancel anytime", d: "Month to month. It should pay for itself on one recovered job, or you drop it.", icon: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4" },
];

const TRADES = [
  { name: "Restoration", href: "/industries/restoration", img: "/industries/restoration.jpg" },
  { name: "HVAC", href: "/industries/hvac", img: "/industries/hvac.jpg" },
  { name: "Plumbing", href: "/industries/plumbing", img: "/industries/plumbing.jpg" },
  { name: "Electrical", href: "/industries/electrical", img: "/industries/electrical.jpg" },
  { name: "General contracting", href: "/industries/general-contracting", img: "/industries/general-contracting.jpg" },
  { name: "Your trade", href: "/industries", img: "/industries/your-trade.jpg" },
];

// Closing-CTA lead-alert chips — the operator's push notifications as sample data,
// positioned to mimic the Review-Harvest reference: `front` chips are prominent
// with an avatar (one bleeds off the right edge, clipped by overflow-hidden), `bg`
// chips sit behind, blurred + faded for depth (no avatar). All read "New lead · $X".
// Avatars are fictional, locally hosted (gpt-image-1, scripts/gen-cta-avatars.ts) —
// no runtime API call, no real-person likeness.
const CTA_ALERTS: { tier: "front" | "bg"; cls: string; text: string; img?: string }[] = [
  // blurred background chips (depth only)
  { tier: "bg", text: "New lead · $2,100", cls: "top-[9%] right-[40%]" },
  { tier: "bg", text: "New lead · $8,900", cls: "bottom-[8%] right-[34%]" },
  // one prominent chip flows off the right edge (clipped)
  { tier: "front", text: "New lead · $11,800", img: "/avatars/lead-1.jpg", cls: "top-[1%] right-[-16%]" },
  // three fully-visible prominent chips, staggered, different prices
  { tier: "front", text: "New lead · $9,200", img: "/avatars/lead-2.jpg", cls: "top-[25%] right-[6%]" },
  { tier: "front", text: "New lead · $6,400", img: "/avatars/lead-3.jpg", cls: "top-[50%] right-[26%]" },
  { tier: "front", text: "New lead · $3,750", img: "/avatars/lead-4.jpg", cls: "bottom-[3%] right-[10%]" },
];

export default function V1Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v4logo" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#how" className="text-white/90 hover:text-white font-medium transition-colors hidden md:block">How it works</a>
          {SHOW_SOCIAL_PROOF && <a href="#results" className="text-white/90 hover:text-white font-medium transition-colors hidden md:block">Results</a>}
          <a href="#product" className="text-white/90 hover:text-white font-medium transition-colors hidden lg:block">Product</a>
          <a href="#pricing" className="text-white/90 hover:text-white font-medium transition-colors hidden sm:block">Pricing</a>
          <BookDemo className="font-medium text-white/90 hover:text-white transition-colors hidden md:block">Book a demo</BookDemo>
          <AuthAwareNavCta />
        </div>
      </LandingNavShell>

      {/* ── Hero — animated scene carousel (call → intake → ranked lead) ──── */}
      <HeroScenesProvider tone="medium">
        <section className="relative flex items-center overflow-hidden">
          <HeroBackdrop />
          <div className="relative max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-10 items-center pt-32 pb-20">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3.5 py-1.5 text-xs font-semibold text-white mb-6">
                <span className="h-1.5 w-1.5 rounded-full bg-landing-primary-glow" /> Lead recovery for home-service trades
              </span>
              <h1 className="font-cv-heading text-[44px] sm:text-[64px] font-bold leading-[0.98] tracking-[-0.035em] mb-6 text-white">
                Recover the leads your business is quietly losing.
              </h1>
              <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
                Calls, missed calls, and web inquiries pile up in voicemail, texts, and sticky notes, and the best jobs get called back too late or not at all. Callverted catches every inbound lead, qualifies it, quotes it from your rules, and hands your team one ranked packet. Nothing slips, and you call the money jobs back first.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <Link href="/sign-up" className="text-center font-semibold bg-landing-primary text-white px-7 py-3.5 rounded-xl hover:bg-blue-600 transition-colors shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)]">Start recovering leads</Link>
                <BookDemo className="text-center font-medium text-white bg-white/10 backdrop-blur border border-white/20 px-7 py-3.5 rounded-xl hover:bg-white/20 transition-colors">Book a demo</BookDemo>
              </div>
              <p className="text-[12.5px] text-white/50 font-medium mb-4">14-day free trial · your team rings first · no per-lead fee</p>
              <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-[13px] text-white/70 font-medium">
                <span className="inline-flex items-center gap-1.5"><Dot /> Set up in ~30 minutes</span>
                <span className="inline-flex items-center gap-1.5"><Dot /> A real person helps you launch</span>
              </div>
            </div>
            <div className="hidden lg:flex justify-end"><HeroSceneCard /></div>
          </div>
        </section>
      </HeroScenesProvider>

      {/* ── Factual strip — light, integrated (no fabricated proof) ─────── */}
      <section className="bg-white border-b border-[#eef1f4]">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5 py-7">
          {FACTS.map((f) => (
            <div key={f.k} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-landing-primary/10 text-landing-primary">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={f.icon} /></svg>
              </span>
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#98a2b3] font-semibold mb-0.5">{f.k}</p>
                <p className="text-[13.5px] font-semibold text-[#344054] leading-snug">{f.v}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pain: photo cards with text overlay + floating UI chip ──────── */}
      <section className="px-6 py-20 sm:py-28 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">The leak</Eyebrow>
            <h2 className="font-cv-heading text-4xl sm:text-[52px] font-bold tracking-[-0.035em] leading-[1.02] mb-4">Right now, leads leak out everywhere.</h2>
            <p className="text-[16px] text-[#667085] leading-relaxed">A missed call, an unlogged conversation, a half-finished form. Every lead that lands in voicemail or a sticky note is revenue you already paid to reach, walking to the next company on the list.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PAINS.map((p, i) => (
              <ScrollReveal key={p.title} delay={i * 110} className="relative h-[440px] overflow-hidden rounded-3xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.img} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden />
                <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(9,14,28,0.9) 0%, rgba(9,14,28,0.62) 30%, rgba(9,14,28,0.5) 55%, rgba(9,14,28,0.76) 100%)" }} aria-hidden />
                {/* real HTML text over the photo */}
                <div className="relative h-full flex flex-col p-6">
                  <h3 className="font-cv-heading text-[22px] font-bold text-white leading-snug mb-2 max-w-[15ch]">{p.title}</h3>
                  <p className="text-[13.5px] text-white/85 leading-relaxed max-w-[30ch]">{p.body}</p>
                  {/* floating UI chip */}
                  <div className="mt-auto">
                    <PainChip chip={p.chip} />
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── How we fix it — mechanism (benefits + extraction demo) ──────── */}
      <section id="how" className="scroll-mt-20 px-6 py-20 sm:py-28 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 items-start mb-14">
            <div>
              <Eyebrow className="mb-3">How we fix it</Eyebrow>
              <h2 className="font-cv-heading text-4xl sm:text-[46px] font-bold tracking-[-0.035em] leading-[1.03] mb-4">Four steps from inbound to booked.</h2>
              <p className="text-[15px] text-[#667085] leading-relaxed">Callverted catches the lead, qualifies it, prices it from your rules, and reassures the caller so they stop dialing the list. You get a ready-to-act packet.</p>
            </div>
            <div className="divide-y divide-[#e6ebf2] border-y border-[#e6ebf2]">
              {FIX.map((f) => (
                <div key={f.t} className="flex gap-4 py-4">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-landing-primary/10 text-landing-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={f.icon} /></svg>
                  </span>
                  <div>
                    <h3 className="font-cv-heading text-[16px] font-bold">{f.t}</h3>
                    <p className="text-[13.5px] text-[#667085] leading-relaxed mt-0.5">{f.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* The differentiator visual */}
          <div className="mb-6">
            <h3 className="font-cv-heading text-2xl sm:text-3xl font-bold tracking-[-0.03em] mb-1.5">One sentence in. Eight useful facts out.</h3>
            <p className="text-[14.5px] text-[#667085] max-w-xl">Not a rigid form. Not an open chatbot. It uses what the caller already said, and asks only for what&apos;s missing.</p>
          </div>
          <ExtractionDemo />

          <div className="flex flex-col sm:flex-row gap-3 mt-10 max-w-lg">
            <Link href="/sign-up" className="flex-1 text-center font-semibold bg-landing-primary text-white px-6 py-3.5 rounded-xl hover:bg-blue-600 transition-colors">Start 14-day free trial</Link>
            <BookDemo className="flex-1 text-center font-medium text-[#152033] bg-white border border-[#d0d7e2] px-6 py-3.5 rounded-xl hover:bg-[#f5f7fb] transition-colors">Book a 15-min demo</BookDemo>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Case studies — photo + stat + quote + tag ───────────────────── */}
      {/* DISABLED: placeholder testimonials (invented names/quotes) — re-enable with real consented proof. */}
      {SHOW_SOCIAL_PROOF && (
      <section id="results" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-5xl mx-auto">
          <div className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">Results</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em]">Trades like yours, turning missed calls into jobs.</h2>
          </div>
          <div className="flex flex-col gap-5">
            {CASES.map((c, i) => (
              <div key={c.business} className={`grid grid-cols-1 md:grid-cols-2 gap-6 items-center rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-4 sm:p-5 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={c.img} alt={c.business} className="h-56 w-full rounded-2xl object-cover" />
                <div className="px-2 sm:px-4 py-2">
                  <p className="inline-block rounded-md border-l-2 border-landing-primary bg-white pl-2.5 pr-3 py-1 text-[13px] font-semibold text-landing-primary mb-3">{c.stat}</p>
                  <h3 className="font-cv-heading text-2xl font-bold mb-3">{c.business}</h3>
                  <blockquote className="text-[14px] italic text-[#667085] leading-relaxed">&ldquo;{c.quote}&rdquo;</blockquote>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-[13px] font-semibold text-[#344054]">{c.who} · <span className="font-normal text-[#98a2b3]">{c.role}</span></p>
                    <span className="rounded-full bg-white border border-[#e3e7ed] px-2.5 py-1 text-[11px] font-semibold text-[#667085]">{c.tag}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>
      )}

      {/* ── The product — real dashboard screenshot + supporting cards ──── */}
      <section id="product" className="scroll-mt-20 px-6 py-20 sm:py-28 bg-white">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="max-w-2xl mb-10">
            <Eyebrow className="mb-3">The product</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em] mb-3">A lead packet for every serious opportunity, not a voicemail light.</h2>
            <p className="text-[15px] text-[#667085]">Each recovered lead arrives complete: contact details, a short summary, the quote from your approved rules, an urgency and value score, and the recommended next step. One ranked list, money jobs on top, nothing left in a voicemail or a note.</p>
          </div>
        </ScrollReveal>

        {/* Dashboard — product screenshot (rendered from DashboardMock at 2x); the hero visual of the section */}
        <ScrollReveal className="max-w-5xl mx-auto mb-16 sm:mb-20">
          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-x-4 top-8 bottom-0 -z-10 rounded-[32px] opacity-40 blur-2xl"
              style={{ background: "radial-gradient(ellipse 65% 55% at 50% 100%, rgba(16,24,40,.4), transparent 75%)" }}
              aria-hidden
            />
            <img
              src="/product/dashboard.png"
              alt="Callverted dashboard showing captured opportunity value, confirmed won revenue, and a ranked list of priority leads"
              width={2048}
              height={1392}
              className="w-full h-auto rounded-2xl shadow-[0_36px_60px_-20px_rgba(16,24,40,.32),0_12px_24px_-10px_rgba(36,84,216,.16)]"
            />
          </div>
        </ScrollReveal>

        {/* Phone-setup reassurance — publish a Callverted number that rings your team first, full width */}
        <ScrollReveal className="max-w-6xl mx-auto mb-4">
          <div className="rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.82fr_1.18fr] gap-8 items-center">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-widest text-landing-primary mb-2">Fits your phone setup</p>
                <h3 className="font-cv-heading text-xl font-bold mb-1">Keep your phones and your team.</h3>
                <p className="text-[13.5px] text-[#667085] leading-relaxed max-w-[42ch]">You publish one Callverted number. It rings your team first. If they answer, the call can be logged and summarized. If they miss it, Callverted answers live and turns it into a ranked lead.</p>
              </div>
              <div className="flex items-start">
                {[
                  { l: "Customer calls", i: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" },
                  { l: "Missed", i: "M18 6 6 18M6 6l12 12" },
                  { l: "Callverted", i: "M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" },
                  { l: "Ranked lead", i: "M4 6h16M4 12h10M4 18h6" },
                ].map((n, i, arr) => (
                  <div key={n.l} className="contents">
                    <div className="flex flex-col items-center gap-2 shrink-0 w-[52px] sm:w-16">
                      <span className={`grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl ${i === 3 ? "bg-landing-primary text-white ring-4 ring-[#eef3ff]" : "bg-white border border-[#e3e7ed] text-[#475467]"}`}>
                        <svg className="h-4 w-4 sm:h-[18px] sm:w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={n.i} /></svg>
                      </span>
                      <span className="text-[10px] sm:text-[10.5px] font-semibold text-[#667085] text-center leading-tight">{n.l}</span>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="flex flex-1 items-center h-10 sm:h-11 min-w-[14px]">
                        <span className="h-[2px] flex-1 bg-gradient-to-r from-[#dbe3f0] to-[#cdd9ee]" />
                        <svg className="text-landing-primary/70 shrink-0 -mx-0.5 h-4 w-4 sm:h-[18px] sm:w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 3 mini feature cards — what's in every packet */}
        <ScrollReveal className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4">
          {SMALL_FEATURES.map((f) => (
            <div key={f.t} className="rounded-2xl border border-[#e3e7ed] bg-white p-5">
              <div className="mb-4 rounded-xl border border-[#eef1f4] bg-[#f9fafb] p-3.5 h-[104px] flex items-center">
                <MiniVisual kind={f.kind} />
              </div>
              <h3 className="font-cv-heading text-[15px] font-bold mb-1">{f.t}</h3>
              <p className="text-[13px] text-[#667085] leading-relaxed">{f.d}</p>
            </div>
          ))}
        </ScrollReveal>
      </section>

      {/* ── ROI calculator + email capture ──────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-24 bg-white border-t border-[#eef1f4]">
        <ScrollReveal className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <Eyebrow className="mb-3">The math</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold tracking-[-0.035em] text-[#152033] mb-4 leading-[1.03]">
              What are missed calls costing you right now?
            </h2>
            <p className="text-[#667085] text-[15px] leading-relaxed max-w-md">
              Drag the sliders to your own call volume and job size. It&apos;s meant to make the cost of silence concrete, not to promise every missed call becomes a job.
            </p>
            <div className="mt-7"><RevenueChart /></div>
          </div>
          <div className="border border-white/10 bg-landing-ink rounded-[24px] p-6 sm:p-7 shadow-[0_40px_90px_-40px_rgba(16,24,40,0.5)]">
            <MissedCallCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── Not a receptionist. A lead recovery system. ─────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-3xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Eyebrow className="mb-3">The category</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em]">Not a receptionist. A lead recovery system.</h2>
            <p className="mt-3 text-[15px] text-[#667085]">How the other ways of handling an inbound lead stack up.</p>
          </div>
          <div className="rounded-3xl border border-[#e3e7ed] bg-white overflow-hidden">
            <div>
              {/* header — on phones only label + AI receptionist + Callverted show (voicemail & text-back are hidden < sm to avoid horizontal scroll) */}
              <div className="grid grid-cols-[1.4fr_1.1fr_1.2fr] sm:grid-cols-[1.5fr_1fr_1fr_1fr_1.1fr] bg-[#f9fafb] border-b border-[#e3e7ed] text-[11.5px] sm:text-[13px] font-bold">
                <div className="px-4 sm:px-6 py-4" />
                {COMPARE_COLS.map((c, i) => (
                  <div key={c} className={`px-2 sm:px-3 py-4 text-center ${i < 2 ? "hidden sm:block" : ""} ${i === 3 ? "text-landing-primary bg-[#eef3ff] rounded-t-xl" : "text-[#667085]"}`}>{c}</div>
                ))}
              </div>
              {COMPARE_ROWS.map((row, i) => (
                <div key={row.dim} className={`grid grid-cols-[1.4fr_1.1fr_1.2fr] sm:grid-cols-[1.5fr_1fr_1fr_1fr_1.1fr] items-center text-[12.5px] sm:text-[13.5px] ${i > 0 ? "border-t border-[#eef1f4]" : ""}`}>
                  <div className="px-4 sm:px-6 py-4 font-semibold text-[#152033]">{row.dim}</div>
                  {row.vals.map((v, j) => (
                    <div key={j} className={`px-2 sm:px-3 py-4 text-center ${j < 2 ? "hidden sm:block" : ""} ${j === 3 ? "bg-[#f7faff] font-semibold text-[#152033]" : "text-[#667085]"}`}>
                      <Cell v={v} accent={j === 3} />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <p className="sm:hidden mt-3 text-center text-[11.5px] text-[#98a2b3]">Shown vs. an AI receptionist — voicemail &amp; text-back columns appear on a wider screen.</p>
        </ScrollReveal>
      </section>

      {/* ── Logo strip — DISABLED: placeholder/invented logos. Re-enable with real consented logos. ── */}
      {SHOW_SOCIAL_PROOF && <LogoMarquee />}

      {/* ── Built for your trade — funnel to /industries ────────────────── */}
      <section id="trades" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="text-center max-w-2xl mx-auto mb-12">
            <Eyebrow className="mb-3">Built for your trade</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em] mb-3">Tuned to how your trade actually gets called.</h2>
            <p className="text-[15px] text-[#667085]">The intake questions and scoring change by trade, not a one-size-fits-all script.</p>
          </ScrollReveal>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {TRADES.map((t, i) => (
              <ScrollReveal key={t.name} delay={(i % 3) * 90} className="group relative block overflow-hidden rounded-2xl border border-[#e3e7ed] transition-shadow hover:shadow-[0_18px_40px_-16px_rgba(16,24,40,.35)]"><Link href={t.href} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={t.img} alt={t.name} className="h-44 sm:h-40 w-full object-cover object-[50%_32%] transition-transform duration-500 group-hover:scale-[1.05]" />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-cv-heading text-[15px] font-bold text-white drop-shadow-sm">{t.name}</span>
                    <span className="flex items-center gap-1 text-[12px] font-semibold text-white/0 -translate-x-1 transition-all duration-300 group-hover:text-white group-hover:translate-x-0">
                      {t.name === "Your trade" ? "See all" : "Learn more"}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
                    </span>
                  </div>
                </div>
              </Link></ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust — founder-led, hands-on (not compliance badges) ───────── */}
      <section className="px-6 py-20 sm:py-24 bg-white border-t border-[#eef1f4]">
        <ScrollReveal className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1.05fr_0.95fr] gap-12 items-center">
          <div>
            <Eyebrow className="mb-3">You&apos;re not on your own</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold tracking-[-0.035em] leading-[1.03] mb-4">Set up by a person, not a portal.</h2>
            <p className="text-[15px] text-[#667085] leading-relaxed mb-8 max-w-lg">We get you live, tune it to how your trade gets called, and stay reachable. No offshore call center, no support maze.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5">
              {TRUST.map((t) => (
                <div key={t.t} className="flex gap-3">
                  <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-landing-primary/10 text-landing-primary">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
                  </span>
                  <div>
                    <h3 className="font-cv-heading text-[15px] font-bold mb-0.5">{t.t}</h3>
                    <p className="text-[13px] text-[#667085] leading-relaxed">{t.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Founder note — swap name/photo for the real founder before launch */}
          <div className="rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-7 sm:p-8">
            <div className="flex items-center gap-3 mb-5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/team/nile.jpg" alt="Nile, founder of Callverted" className="h-12 w-12 rounded-full object-cover ring-1 ring-black/5" />

              <div>
                <p className="font-cv-heading text-[15px] font-bold text-[#152033]">Nile</p>
                <p className="text-[12.5px] text-[#667085]">Founder, Callverted</p>
              </div>
            </div>
            <p className="font-cv-heading text-[19px] sm:text-[21px] font-semibold leading-snug text-[#152033] mb-4">
              &ldquo;I&apos;ll personally help you get set up and answer anything, before and after you start. If it&apos;s not recovering jobs for you, I want to hear about it.&rdquo;
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="text-center font-semibold bg-landing-primary text-white px-5 py-3 rounded-xl hover:bg-blue-600 transition-colors text-sm">Book a 15-min setup call</a>
              <a href="mailto:hello@callverted.com" className="text-center font-medium text-[#152033] bg-white border border-[#d0d7e2] px-5 py-3 rounded-xl hover:bg-[#f5f7fb] transition-colors text-sm">Or just message us</a>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-md mx-auto text-center">
          <Eyebrow className="mb-3">Pricing</Eyebrow>
          <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em] mb-6">One plan. The whole service.</h2>
          <PricingCard />
        </ScrollReveal>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-2xl mx-auto">
          <div className="text-center mb-8"><Eyebrow className="mb-3">FAQ</Eyebrow><h2 className="font-cv-heading text-2xl sm:text-3xl font-bold tracking-[-0.035em]">Questions owners ask first</h2></div>
          <div className="rounded-2xl border border-[#e3e7ed] bg-white overflow-hidden">
            {FAQS.slice(0, 6).map((faq, i) => (
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

      {/* ── Closing CTA — gradient card: copy left, live lead-alert chips right ── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl px-8 sm:px-10 py-14 sm:py-16 text-white shadow-[0_30px_60px_-24px_rgba(28,63,168,0.5)]" style={{ background: "linear-gradient(135deg, #2a5ae0 0%, #1c3fa8 55%, #16307e 100%)" }}>
            <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,470px)_1fr]">
              <div className="relative z-10 max-w-lg mx-auto lg:mx-0 text-center lg:text-left">
                <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em] mb-4 leading-[1.05]">Stop letting good leads leak away.</h2>
                <p className="text-white/70 mb-8 text-[15px]">Give your team the first ring. Callverted recovers, qualifies, and ranks everything that follows: missed calls, answered calls, and web inquiries, all in one place.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                  <Link href="/sign-up" className="text-center font-semibold bg-white text-landing-primary px-6 py-3.5 rounded-xl hover:bg-[#f0f4ff] transition-colors shadow-lg whitespace-nowrap">Start recovering leads</Link>
                  <BookDemo className="text-center font-semibold text-white bg-white/10 border border-white/40 px-6 py-3.5 rounded-xl hover:bg-white/20 transition-colors whitespace-nowrap">Book a 15-min demo</BookDemo>
                </div>
                <p className="mt-5 text-[12.5px] text-white/60">14-day free trial · no contracts · a real person helps you launch</p>
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
      <JsonLd data={faqSchema(FAQS.slice(0, 6))} />

      {/* ── Corner CTA — opens the book-a-demo / lead-capture modal ─────── */}
      <BookDemo
        title="Questions before you start?"
        blurb="Book a quick call or leave your details — a real person (not a bot) will get back to you, usually same day."
        className="fixed bottom-5 right-5 z-50 hidden sm:flex items-center gap-2.5 rounded-full bg-landing-primary text-white pl-4 pr-5 py-3 shadow-[0_12px_30px_-8px_rgba(36,84,216,0.6)] hover:bg-blue-600 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
        <span className="text-sm font-semibold">Questions? Talk to us</span>
      </BookDemo>
    </div>
  );
}

function Dot() {
  return <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />;
}

/** Small purpose-built visual per feature card, instead of a generic icon. */
function MiniVisual({ kind }: { kind: "context" | "pricing" | "recap" }) {
  if (kind === "context") {
    // A mini call record: waveform + transcript lines + captured-field chips.
    return (
      <div className="w-full">
        <div className="flex items-end gap-[3px] h-4 mb-2.5" aria-hidden>
          {[5, 9, 6, 12, 8, 14, 7, 11, 5, 9, 6, 4, 8].map((h, i) => (
            <span key={i} className="w-[3px] rounded-full bg-landing-primary/35" style={{ height: `${h}px` }} />
          ))}
        </div>
        <div className="space-y-1.5 mb-2.5">
          <div className="h-1.5 w-[85%] rounded-full bg-[#e3e7ed]" />
          <div className="h-1.5 w-[60%] rounded-full bg-[#e3e7ed]" />
        </div>
        <div className="flex gap-1.5">
          <span className="rounded-md bg-[#eef3ff] px-1.5 py-0.5 text-[9px] font-semibold text-landing-primary">Water damage</span>
          <span className="rounded-md bg-[#eef3ff] px-1.5 py-0.5 text-[9px] font-semibold text-landing-primary">3 rooms</span>
        </div>
      </div>
    );
  }
  if (kind === "pricing") {
    // A mini pricing rulebook with an "approved by you" lock.
    return (
      <div className="w-full space-y-1.5">
        {[
          { l: "Water extraction", v: "$180/rm" },
          { l: "Emergency call-out", v: "$95" },
        ].map((r) => (
          <div key={r.l} className="flex items-center justify-between rounded-lg bg-white border border-[#eef1f4] px-2.5 py-1.5">
            <span className="text-[10.5px] text-[#475467]">{r.l}</span>
            <span className="font-cv-mono text-[10.5px] font-bold text-[#152033]">{r.v}</span>
          </div>
        ))}
        <div className="flex items-center gap-1 text-[9.5px] font-semibold text-[#177245] pt-0.5">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M20 6 9 17l-5-5" /></svg>
          Locked to rules you approved
        </div>
      </div>
    );
  }
  // recap: a mini ascending bar chart with a running total.
  const bars = [26, 34, 30, 46, 40, 58, 68];
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[9.5px] font-semibold uppercase tracking-wide text-[#98a2b3]">This week</span>
        <span className="font-cv-heading text-[13px] font-black text-[#177245]">$34k</span>
      </div>
      <div className="flex items-end justify-between gap-[5px] h-[52px]" aria-hidden>
        {bars.map((h, i) => (
          <span key={i} className={`flex-1 rounded-t-sm ${i === bars.length - 1 ? "bg-[#177245]" : "bg-[#c9ead9]"}`} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

/** Small upward recovered-revenue area chart (illustrative). Pure SVG, no lib. */
function RevenueChart() {
  const data = [0, 1.5, 3, 5, 7.5, 10.5, 14, 18, 23, 28, 33.6];
  const w = 320, h = 132, pad = 6;
  const max = 33.6 * 1.12;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - (v / max) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  const area = `${line} L ${last.x.toFixed(1)} ${h - pad} L ${pts[0].x.toFixed(1)} ${h - pad} Z`;
  return (
    <div className="max-w-sm rounded-2xl border border-[#e3e7ed] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">Recovered revenue</p>
        <span className="text-[11px] text-[#98a2b3]">First 30 days</span>
      </div>
      <div className="flex items-end gap-2 mb-3">
        <span className="font-cv-heading text-3xl font-black text-[#177245]">+$33,600</span>
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#177245] pb-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 18 10 12l4 3 6-8M20 7h-4M20 7v4" /></svg>
          trending up
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Recovered revenue trending up over the first 30 days">
        <defs>
          <linearGradient id="cvRevFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#23a35a" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#23a35a" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.25, 0.5, 0.75].map((g) => (
          <line key={g} x1={pad} x2={w - pad} y1={h - pad - g * (h - pad * 2)} y2={h - pad - g * (h - pad * 2)} stroke="#eef1f4" strokeWidth="1" />
        ))}
        <path d={area} fill="url(#cvRevFill)" />
        <path d={line} fill="none" stroke="#177245" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={last.x} cy={last.y} r="4" fill="#177245" stroke="#fff" strokeWidth="2" />
      </svg>
      <div className="flex justify-between mt-1.5 text-[10.5px] text-[#98a2b3]"><span>Day 1</span><span>Day 30</span></div>
    </div>
  );
}

// A small, authentic phone-UI artifact for the pain cards — a missed-call event
// (filled red call icon + missed arrow badge) or, for the "next" card, a live
// outgoing call to a competitor (green, pulsing). Reads like a real OS call log,
// not a generic tinted-square chip.
function PainChip({ chip }: { chip: { kind: "call" | "missed" | "next"; top: string; sub: string } }) {
  const active = chip.kind === "next"; // an outgoing call connecting to someone else
  return (
    <div className="inline-flex items-center gap-3 rounded-2xl bg-white/92 backdrop-blur-md pl-2.5 pr-4 py-2.5 shadow-[0_16px_38px_-12px_rgba(0,0,0,0.6)] ring-1 ring-black/[0.06]">
      <span className={`relative grid h-9 w-9 place-items-center rounded-full text-white ${active ? "bg-[#22a95b]" : "bg-[#e5484d]"}`}>
        {active && <span className="absolute inset-0 rounded-full bg-[#22a95b] animate-ping opacity-60" aria-hidden />}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="relative">
          <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z" />
        </svg>
        {!active && (
          <span className="absolute -top-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-white text-[#e5484d] ring-1 ring-black/[0.06]" aria-hidden>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 7 7 17M7 8v9h9" /></svg>
          </span>
        )}
      </span>
      <div className="text-left">
        <p className="text-[13px] font-semibold text-[#0f141e] leading-tight">{chip.top}</p>
        <p className={`text-[11.5px] leading-tight mt-0.5 ${active ? "text-[#e5484d] font-semibold" : "text-[#8a94a6]"}`}>{chip.sub}</p>
      </div>
    </div>
  );
}

function Cell({ v, accent = false }: { v: boolean | string; accent?: boolean }) {
  if (v === true) return <svg className={`inline w-5 h-5 ${accent ? "text-landing-primary" : "text-[#23a35a]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
  if (v === false) return <span className="inline-block w-4 h-0.5 rounded-full bg-[#d0d7e2]" />;
  return <span>{v}</span>;
}
