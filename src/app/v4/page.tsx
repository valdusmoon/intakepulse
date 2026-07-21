import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { BrowserFrame, MediaSlot, PhoneFrame } from "@/components/marketing/MediaSlot";
import { MissedCallCalculator } from "@/components/marketing/MissedCallCalculator";
import { PricingCard } from "@/components/marketing/PricingCard";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { V4HeroScenes } from "@/components/marketing/V4HeroScenes";
import { ExtractionDemo } from "@/components/marketing/V4Interactive";
import { V4StepTour } from "@/components/marketing/V4StepTour";

/**
 * /v4 — "PRODUCT TOUR" LAYOUT DRAFT (throwaway, noindex).
 *
 * Same approved copy as /v2, laid out on a completely different thesis. v2
 * argues in prose and icon cards. v4 bets the page on showing the software,
 * because the research says so: CloudTalk carries a whole page on three
 * screenshots, Bookipi carries one on ten looping screen recordings in browser
 * chrome, and Callsara shows zero product UI and pays for it in credibility.
 * Callverted's dashboard is good-looking. This draft points at it.
 *
 * TWO RULES A FUTURE EDITOR MUST NOT BREAK:
 *
 * 1. ALL-LIGHT. There is no dark band anywhere except the final CTA gradient
 *    card and the footer. Not even the hero. Every other draft goes dark
 *    somewhere; this one deliberately does not, so product screenshots (which
 *    are light UI) never sit on a background that fights them. If you find
 *    yourself adding a dark section for "rhythm", you are solving the wrong
 *    problem. Rhythm here comes from rule 2.
 *
 * 2. COLUMN OSCILLATION. No two adjacent sections share a column structure.
 *    That constraint is the only thing doing the work that dark bands normally
 *    do, so it has to hold end to end:
 *
 *      2  Hero ................ 1 col, centered           max-w-3xl / 6xl
 *      3  Facts ............... 4 col, thin band          max-w-6xl
 *      4  Product bento ....... 1 wide + 2 half           max-w-6xl
 *      5  Step tour ........... 2 col, sticky asymmetric  max-w-6xl
 *      6  Zigzag rows ......... 2 col, ALTERNATING sides  max-w-5xl
 *      7  Lead sources ........ 4 col                     max-w-6xl
 *      8  The alert ........... 3 col                     max-w-5xl
 *      9  ROI calculator ...... 2 col                     max-w-5xl
 *     10  Comparison .......... 1 col table               max-w-3xl
 *     11  Pricing ............. 2 col                     max-w-5xl
 *     12  FAQ ................. 1 col                     max-w-2xl
 *     13  Final CTA ........... full-bleed panel, outside the grid rhythm
 *
 *    5 and 6 are both two-column, and that is intentional rather than a lapse:
 *    5 is one sticky asymmetric split that never moves, 6 is four even splits
 *    that flip sides on every other row. They do not read as the same shape.
 *    Nothing else in the page is allowed that latitude.
 *
 * The hero is CENTERED, not split. That is the deliberate departure from v2 and
 * from the live homepage, and it exists so the hero visual underneath gets the
 * full page width instead of half of it.
 *
 * That visual is <V4HeroScenes/>: the same three-beat product story as the
 * homepage hero (call → intake → ranked lead), on the same beat durations, but
 * rebuilt as light app UI in browser chrome instead of a dark glass panel over
 * a photo. Reusing the homepage component directly would have broken rule 1,
 * and a full-width dashboard reads as the software, which is the whole thesis.
 *
 * MEDIA: this draft carries the most unbuilt assets of the three. Every
 * MediaSlot prompt describes what to SCREEN-RECORD or mock up, not an image
 * prompt, because these are product captures. Grep "MediaSlot" for the
 * outstanding list. Two things are already real and need nothing generated:
 * /product/dashboard.png in the wide bento card, and the animated hero.
 */

export const metadata: Metadata = {
  title: "Callverted | Capture Every Lead, Call Back the Right Ones First",
  robots: { index: false, follow: false },
};

// ── Icon paths (stroke, 24-grid) ────────────────────────────────────────────
const I = {
  phone: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z",
  recover: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4",
  list: "M4 6h16M4 12h10M4 18h6",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  globe: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  wrench: "M14.7 6.3a4 4 0 0 1-5.4 5.4L4 17v3h3l5.7-5.7a4 4 0 0 1 5.4-5.4l-2.7 2.7-1.7-1.7 2.7-2.7z",
} as const;

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-widest text-landing-primary ${className}`}>{children}</p>;
}

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

function IconChip({ d }: { d: string }) {
  return (
    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-landing-primary/10 text-landing-primary">
      <Icon d={d} />
    </span>
  );
}

// ── Section data (copy carried over from /v2) ───────────────────────────────
const FACTS = [
  { k: "Built for urgent trades", v: "Restoration · Plumbing · HVAC · Electrical", icon: I.wrench },
  { k: "Your team first", v: "Callverted catches what rings out", icon: I.phone },
  { k: "Missed or answered", v: "Calls become lead records", icon: I.recover },
  { k: "Structured outcome", v: "Urgency, fit, value, next action", icon: I.list },
];

const SOURCES = [
  { icon: I.phone, t: "Missed-call recovery", d: "Your team misses the call. Callverted answers live and qualifies the job on the spot." },
  { icon: I.recover, t: "Answered-call capture", d: "Switch it on and the calls your team takes get summarized and scored too. Details stop living in someone's head." },
  { icon: I.globe, t: "Website widget", d: "One line of code adds intake to your site. Visitors describe the job before they bounce." },
  { icon: I.link, t: "Direct intake link", d: "One link for ads, your Google profile, texts, and social. Every submission gets qualified the same way." },
];

const PACKET = [
  { t: "Priority", d: "Hot, Warm, or Cool, scored on urgency, job value, and lead quality." },
  { t: "Summary", d: "What happened, in two sentences your team can read while dialing." },
  { t: "Service fit", d: "The matched service, off-list requests, and whether it's in your area." },
  { t: "Value estimate", d: "A rough range so big jobs never wait behind small ones." },
  { t: "Transcript", d: "Every word, so you can verify exactly what was said." },
  { t: "Recommended next action", d: "Call now, review pricing, or follow up later." },
];

const COMPARE_COLS = ["Voicemail", "Missed-call text-back", "AI receptionist", "Callverted"];
const COMPARE_ROWS: { dim: string; vals: (boolean | string)[] }[] = [
  { dim: "Answers missed calls live", vals: [false, false, true, true] },
  { dim: "Captures answered calls", vals: [false, false, false, true] },
  { dim: "Qualifies web inquiries", vals: [false, false, false, true] },
  { dim: "Confirms the job back to the caller", vals: [false, false, false, true] },
  { dim: "Creates structured lead packets", vals: [false, false, false, true] },
  { dim: "Scores urgency and value", vals: [false, false, false, true] },
  { dim: "Quotes only from approved rules", vals: [false, false, false, true] },
  { dim: "What it's built for", vals: ["Storing messages", "Sending a text", "Answering calls", "Winning the job"] },
];

const TRUST = [
  "We build your call flow and lead sources with you",
  "You approve every service, price, and question before launch",
  "We run test calls together before a customer ever hears it",
  "A real person helps you tune it after launch",
];

const FAQ_V4 = [
  { q: "Is this just an AI receptionist?", a: "No. An answering service takes a message. Callverted qualifies the job, scores the lead, and tells your team who to call back first. It also captures answered calls and website inquiries, not just missed ones." },
  { q: "Does it replace my phone number?", a: "No. You publish a Callverted number that rings your team first on every call. Callverted only steps in when nobody picks up." },
  { q: "What happens when my team answers?", a: "If you switch on answered-call capture, the call is transcribed, summarized, and scored, so the details are saved instead of disappearing after hangup. The audio itself is deleted once transcribed, never stored." },
  { q: "Can it qualify website leads too?", a: "Yes. Add the website widget or share your intake link. Those submissions go through the same qualification and scoring as phone calls." },
  { q: "Will the AI make up prices?", a: "Never. Callers only hear pricing you approved, word for word. If there is no approved price, it says your team will follow up with a quote." },
  { q: "How fast can we launch?", a: "About 30 minutes of setup: call flow, service area, pricing rules, and test calls. We walk through it with you." },
];

// ── Zigzag feature rows ─────────────────────────────────────────────────────
// Row 1 uses the live ExtractionDemo component rather than a media slot.
const ZIGZAG = [
  {
    eyebrow: "Approved-price quoting",
    title: "It quotes your prices, or it quotes nothing.",
    body: "Callers only hear pricing you approved, repeated word for word. Anything outside your rules and it says your team will follow up with a quote. It never invents a number on your behalf.",
    url: "app.callverted.com/settings/services",
    slotTitle: "Screen recording: pricing rules to spoken quote",
    slotNote: "Split view of the approved price row and the transcript line that used it.",
    slotPrompt:
      "Screen-record the approved-services table with a highlighted row: 'Water damage mitigation · $1,800 to $3,200 · Quoted to callers'. Then cut to a call transcript where the assistant line reads that exact range back, with the matched rule badged beside it. Then show a second transcript where an unapproved service comes up and the assistant says the team will follow up with a quote, with a 'No approved price' badge. ~14s.",
  },
  {
    eyebrow: "Answered-call capture",
    title: "The calls your team takes stop disappearing.",
    body: "Switch it on and the calls your team answers get transcribed, summarized, and scored too. The name, the job, and the callback stop living in someone's head. The audio itself is deleted once transcribed, never stored.",
    url: "app.callverted.com/leads",
    slotTitle: "Screen recording: answered-call becomes a lead",
    slotNote: "A team-answered call producing a scored lead record with source badge.",
    slotPrompt:
      "Screen-record the leads list filtered to source 'Team answered'. Open one record: show the summary, the extracted service and urgency, the score, and the transcript. Make the 'Audio deleted after transcription' line clearly legible, since that is the trust point. Then show the recording toggle in settings being switched on. ~15s.",
  },
  {
    eyebrow: "Weekly recap",
    title: "You find out what the phone is actually worth.",
    body: "Every Monday you get the week in one view: what came in, from which source, how fast it got called back, and what it was worth. The leak stops being a feeling and starts being a number.",
    url: "app.callverted.com/reports",
    slotTitle: "Screen recording: weekly recap email and report",
    slotNote: "The emailed recap, then the same numbers on the Reports page.",
    slotPrompt:
      "Screen-record the weekly recap email opening in an inbox: total leads, hot leads, captured opportunity value, median callback time. Click through to the Reports page and scroll the matching charts, lead volume by source and response-time distribution. Change the date range once so the numbers refresh. ~16s.",
  },
];

export default function V4Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v4logo" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#product" className="text-white/90 hover:text-white font-medium transition-colors hidden md:block">Product</a>
          <a href="#setup" className="text-white/90 hover:text-white font-medium transition-colors hidden lg:block">Setup</a>
          <a href="#pricing" className="text-white/90 hover:text-white font-medium transition-colors hidden sm:block">Pricing</a>
          <BookDemo className="font-medium text-white/90 hover:text-white transition-colors hidden md:block">Book a demo</BookDemo>
          <AuthAwareNavCta />
        </div>
      </LandingNavShell>

      {/* ── 2. Hero — CENTERED stack, light. 1 column. ──────────────────── */}
      <section className="relative overflow-hidden bg-white px-6 pt-32 pb-16 sm:pb-20">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[520px] -z-10"
          aria-hidden
          style={{ background: "radial-gradient(70% 60% at 50% 0%, rgba(36,84,216,0.09) 0%, rgba(255,255,255,0) 70%)" }}
        />
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#e3e7ed] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#344054] shadow-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-landing-primary" />
            Built for restoration, HVAC, plumbing, and electrical
          </span>
          <h1 className="font-cv-heading mb-5 text-[42px] font-bold leading-[1.0] tracking-[-0.038em] sm:text-[64px]">
            Capture every lead.
            <br className="hidden sm:block" /> Call back the right ones first.
          </h1>
          <p className="mx-auto mb-8 max-w-xl text-[17px] leading-relaxed text-[#667085]">
            Every missed call, answered call, and website inquiry becomes one scored lead in one ranked list.
          </p>
          <div className="mb-4 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="rounded-xl bg-landing-primary px-7 py-3.5 text-center font-semibold text-white shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)] transition-colors hover:bg-blue-600"
            >
              Start your free trial
            </Link>
            <BookDemo className="rounded-xl border border-[#e3e7ed] bg-white px-7 py-3.5 text-center font-medium text-[#344054] transition-colors hover:border-[#cbd5e5] hover:bg-[#f9fafb]">
              Book a demo
            </BookDemo>
          </div>
          <p className="text-[12.5px] font-medium text-[#98a2b3]">
            14-day free trial · your phones ring first · no per-lead fees
          </p>
        </ScrollReveal>

        {/* The hero visual is BUILT, not a placeholder: the three-beat product
            story (call → intake → ranked lead) animating in light app UI inside
            browser chrome. Same beats and durations as the homepage hero, so the
            two stay in narrative sync, but light and full-width per rules 1 & 2
            above. No asset to generate here. */}
        <ScrollReveal delay={120} className="mx-auto mt-14 max-w-5xl">
          <V4HeroScenes />
        </ScrollReveal>
      </section>

      {/* ── 3. Factual strip — 4 columns, thin band, hairline borders ───── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-7">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {FACTS.map((f) => (
            <div key={f.k} className="flex items-start gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-landing-primary/10 text-landing-primary">
                <Icon d={f.icon} className="h-[17px] w-[17px]" />
              </span>
              <div className="min-w-0">
                <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#98a2b3]">{f.k}</p>
                <p className="text-[13.5px] font-semibold leading-snug text-[#344054]">{f.v}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. Product bento — 1 wide + 2 half ──────────────────────────── */}
      <section id="product" className="scroll-mt-20 bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-12 max-w-2xl">
            <Eyebrow className="mb-3">The product</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[44px]">
              One list, ranked by who to call first.
            </h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">
              Missed calls, answered calls, and website inquiries all become the same lead record. Here is what your
              team actually looks at.
            </p>
          </ScrollReveal>

          {/* Wide card — the real dashboard screenshot, ~2x the halves */}
          <ScrollReveal className="mb-4 rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-8">
            <div className="mb-6 max-w-2xl">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#98a2b3]">Priority queue</p>
              <h3 className="font-cv-heading mb-2 text-xl font-bold tracking-[-0.02em] sm:text-2xl">
                Your team stops guessing who to call back.
              </h3>
              <p className="text-[14px] leading-relaxed text-[#667085]">
                Every lead is scored on urgency, job value, and lead quality, then sorted. The burst pipe never waits
                behind a filter-change question.
              </p>
            </div>
            <BrowserFrame url="app.callverted.com/dashboard">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/product/dashboard.png"
                alt="Callverted dashboard showing captured opportunity value, confirmed won revenue, and a ranked list of priority leads"
                width={2048}
                height={1392}
                className="h-auto w-full"
              />
            </BrowserFrame>
          </ScrollReveal>

          {/* Two half cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <ScrollReveal delay={80} className="rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-7">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#98a2b3]">Lead detail</p>
              <h3 className="font-cv-heading mb-2 text-lg font-bold tracking-[-0.02em] sm:text-xl">
                Everything needed to win the callback, on one screen.
              </h3>
              <p className="mb-5 text-[13.5px] leading-relaxed text-[#667085]">
                What happened, the matched service, whether it&apos;s in your area, a rough value range, and the
                recommended next action.
              </p>
              <MediaSlot
                kind="ui"
                className="aspect-[4/3]"
                title="Lead detail drawer"
                note="High-fidelity mockup of one open lead record."
                dims="1200×900 · png @2x"
                prompt="Mock up the lead detail drawer at 2x, using Blue Star Restoration demo data. Must show, top to bottom: caller name and number, Hot 92 priority badge with the urgency/value/quality breakdown, the two-sentence summary, matched service 'Water damage mitigation', in-service-area check, estimated value $1.8k to $3.2k, and a highlighted 'Call within 10 minutes' next-action block. Real app typography and spacing, not a wireframe."
              />
            </ScrollReveal>

            <ScrollReveal delay={160} className="rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-7">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#98a2b3]">Call transcript</p>
              <h3 className="font-cv-heading mb-2 text-lg font-bold tracking-[-0.02em] sm:text-xl">
                Every word, so you can check what was said.
              </h3>
              <p className="mb-5 text-[13.5px] leading-relaxed text-[#667085]">
                The full conversation sits under the summary. Nothing about the job is taken on trust, including what
                Callverted said back.
              </p>
              <MediaSlot
                kind="ui"
                className="aspect-[4/3]"
                title="Call transcript panel"
                note="High-fidelity mockup of a full qualified-call transcript."
                dims="1200×900 · png @2x"
                prompt="Mock up the transcript panel at 2x. Alternating caller and Callverted turns for a water-damage emergency call, ending on the closing reassurance that names Blue Star Restoration. Badge the two turns where a field was extracted (service, urgency) with a small inline chip showing the captured value. Include the duration and 'Audio deleted after transcription' footer line. Real app typography, not a wireframe."
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 5. Sticky-preview step switcher — 2 col, sticky asymmetric ──── */}
      <section id="setup" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-12 max-w-2xl">
            <Eyebrow className="mb-3">Setup</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[44px]">
              Six steps, about thirty minutes, done with you.
            </h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">
              Pick a step to see the screen. Nothing goes live until you have heard a test call yourself.
            </p>
          </ScrollReveal>
          <V4StepTour />
        </div>
      </section>

      {/* ── 6. Zigzag feature rows — 2 col, sides alternate ─────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto flex max-w-5xl flex-col gap-16 sm:gap-24">
          {/* Row 1 — smart qualification, real interactive demo, visual left */}
          <ScrollReveal className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
            <div className="min-w-0">
              <ExtractionDemo />
            </div>
            <div>
              <Eyebrow className="mb-3">Smart qualification</Eyebrow>
              <h3 className="font-cv-heading text-[26px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[32px]">
                It asks less because it understands more.
              </h3>
              <hr className="my-5 border-0 border-t border-[#e3e7ed]" />
              <p className="text-[15px] leading-relaxed text-[#667085]">
                If the caller already said it&apos;s a burst pipe in the kitchen, Callverted doesn&apos;t ask again. It
                listens first, then asks only for what&apos;s missing. A few questions, not an interrogation.
              </p>
            </div>
          </ScrollReveal>

          {/* Rows 2-4 — visual left, text right; 2 and 4 flip on desktop */}
          {ZIGZAG.map((row, i) => {
            const flip = i % 2 === 0; // ZIGZAG[0] is page-row 2, so even indices flip
            return (
              <ScrollReveal key={row.title} className="grid grid-cols-1 items-center gap-8 lg:grid-cols-2 lg:gap-14">
                <div className={`min-w-0 ${flip ? "lg:order-2" : ""}`}>
                  <BrowserFrame url={row.url}>
                    <div className="p-2.5 sm:p-3">
                      <MediaSlot
                        kind="video"
                        className="aspect-[16/10]"
                        title={row.slotTitle}
                        note={row.slotNote}
                        prompt={row.slotPrompt}
                        dims="1600×1000 · mp4 loop"
                      />
                    </div>
                  </BrowserFrame>
                </div>
                <div className={flip ? "lg:order-1" : ""}>
                  <Eyebrow className="mb-3">{row.eyebrow}</Eyebrow>
                  <h3 className="font-cv-heading text-[26px] font-bold leading-[1.08] tracking-[-0.03em] sm:text-[32px]">
                    {row.title}
                  </h3>
                  <hr className="my-5 border-0 border-t border-[#e3e7ed]" />
                  <p className="text-[15px] leading-relaxed text-[#667085]">{row.body}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* ── 7. Lead sources — 4 columns ─────────────────────────────────── */}
      <section id="sources" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-12 max-w-2xl">
            <Eyebrow className="mb-3">Lead sources</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[44px]">
              Four ways in. One list to work.
            </h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SOURCES.map((s, i) => (
              <ScrollReveal key={s.t} delay={i * 80} className="rounded-2xl border border-[#e3e7ed] bg-white p-6">
                <IconChip d={s.icon} />
                <h3 className="font-cv-heading mb-1 mt-4 text-[15px] font-bold">{s.t}</h3>
                <p className="text-[13px] leading-relaxed text-[#667085]">{s.d}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 8. The alert — 3 columns ────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-start gap-10 lg:grid-cols-3 lg:gap-12">
          {/* Phone, column 1 */}
          <ScrollReveal className="flex justify-center lg:justify-start">
            <PhoneFrame className="w-full max-w-[260px]">
              <div className="flex h-[440px] flex-col justify-start px-3 pb-6 pt-11" style={{ background: "linear-gradient(160deg,#1b2740 0%,#0d1524 60%,#131c30 100%)" }}>
                <p className="mb-1 text-center font-cv-heading text-[46px] font-light leading-none text-white">7:42</p>
                <p className="mb-6 text-center text-[11.5px] font-medium text-white/50">Tuesday, June 11</p>

                <div className="rounded-2xl bg-white/[0.14] p-3 backdrop-blur-md ring-1 ring-white/10">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] bg-landing-primary text-[8px] font-black text-white">C</span>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-white/70">Callverted</span>
                    <span className="ml-auto text-[10px] text-white/45">now</span>
                  </div>
                  <p className="font-cv-heading text-[13px] font-bold leading-snug text-white">
                    New lead · Hot · 92
                  </p>
                  <p className="mt-0.5 text-[12px] leading-snug text-white/70">
                    Water damage · Emergency · $1.8k–$3.2k
                  </p>
                </div>

                <div className="mt-2 rounded-2xl bg-white/[0.07] p-3 ring-1 ring-white/5">
                  <div className="mb-1.5 flex items-center gap-2">
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-[5px] bg-landing-primary/60 text-[8px] font-black text-white">C</span>
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-white/50">Callverted</span>
                    <span className="ml-auto text-[10px] text-white/35">6:18 PM</span>
                  </div>
                  <p className="font-cv-heading text-[12.5px] font-bold leading-snug text-white/80">
                    New lead · Warm · 54
                  </p>
                  <p className="mt-0.5 text-[11.5px] leading-snug text-white/50">
                    AC not cooling · Same week · $400–$900
                  </p>
                </div>
              </div>
            </PhoneFrame>
          </ScrollReveal>

          {/* Copy + packet, columns 2-3 */}
          <div className="lg:col-span-2">
            <ScrollReveal className="mb-7">
              <Eyebrow className="mb-3">The alert</Eyebrow>
              <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[40px]">
                It hits your phone in about a minute.
              </h2>
              <p className="max-w-xl text-[15px] leading-relaxed text-[#667085]">
                Not a missed-call badge. A lead packet, ranked against every other lead waiting, with everything your
                team needs before they dial.
              </p>
            </ScrollReveal>
            <ScrollReveal delay={90} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PACKET.map((p) => (
                <div key={p.t} className="rounded-2xl border border-[#e3e7ed] bg-[#f9fafb] p-5">
                  <div className="mb-1 flex items-center gap-2">
                    <svg className="h-4 w-4 shrink-0 text-landing-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                    <h3 className="font-cv-heading text-[15px] font-bold">{p.t}</h3>
                  </div>
                  <p className="text-[13px] leading-relaxed text-[#667085]">{p.d}</p>
                </div>
              ))}
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ── 9. ROI calculator — 2 columns ───────────────────────────────── */}
      <section className="border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <Eyebrow className="mb-3">The math</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] text-[#152033] sm:text-[42px]">
              What are slow callbacks costing you?
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-[#667085]">
              Missed calls are easy to measure. Slow follow-up is the bigger leak.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-landing-ink p-6 shadow-[0_40px_90px_-40px_rgba(16,24,40,0.5)] sm:p-7">
            <MissedCallCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 10. Comparison table — 1 column ─────────────────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-3xl">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <Eyebrow className="mb-3">The category</Eyebrow>
            <h2 className="font-cv-heading text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              Not an answering service. A system for winning the callback.
            </h2>
            <p className="mt-3 text-[15px] text-[#667085]">
              Answering the phone is only the start. Callverted qualifies the job, scores the lead, reassures the
              customer, and points your team at the callbacks worth winning.
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl border border-[#e3e7ed] bg-white">
            <div className="grid grid-cols-[1.4fr_1.1fr_1.2fr] border-b border-[#e3e7ed] bg-[#f9fafb] text-[11.5px] font-bold sm:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] sm:text-[13px]">
              <div className="px-4 py-4 sm:px-6" />
              {COMPARE_COLS.map((c, i) => (
                <div key={c} className={`px-2 py-4 text-center sm:px-3 ${i < 2 ? "hidden sm:block" : ""} ${i === 3 ? "rounded-t-xl bg-[#eef3ff] text-landing-primary" : "text-[#667085]"}`}>{c}</div>
              ))}
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={row.dim} className={`grid grid-cols-[1.4fr_1.1fr_1.2fr] items-center text-[12.5px] sm:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] sm:text-[13.5px] ${i > 0 ? "border-t border-[#eef1f4]" : ""}`}>
                <div className="px-4 py-4 font-semibold text-[#152033] sm:px-6">{row.dim}</div>
                {row.vals.map((v, j) => (
                  <div key={j} className={`px-2 py-4 text-center sm:px-3 ${j < 2 ? "hidden sm:block" : ""} ${j === 3 ? "bg-[#f7faff] font-semibold text-[#152033]" : "text-[#667085]"}`}>
                    <Cell v={v} accent={j === 3} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-[11.5px] text-[#98a2b3] sm:hidden">
            Shown vs. an AI receptionist. Voicemail &amp; text-back columns appear on a wider screen.
          </p>
        </ScrollReveal>
      </section>

      {/* ── 11. Pricing + done-with-you — 2 columns ─────────────────────── */}
      <section id="pricing" className="scroll-mt-20 border-y border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <Eyebrow className="mb-3">Pricing</Eyebrow>
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              One flat price. Everything included.
            </h2>
            <p className="mx-auto mb-6 max-w-md text-[14.5px] text-[#667085] lg:mx-0">
              Missed-call answering, answered-call capture, website intake, lead scoring, alerts, and weekly reports. No
              per-call or per-lead fees.
            </p>
            <PricingCard />
          </div>
          <div>
            <Eyebrow className="mb-3">Done with you</Eyebrow>
            <h3 className="font-cv-heading mb-6 text-2xl font-bold leading-[1.1] tracking-[-0.035em] sm:text-[28px]">
              We help set it up, not just hand you software.
            </h3>
            <div className="space-y-4">
              {TRUST.map((t) => (
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

      {/* ── 12. FAQ — 1 column ──────────────────────────────────────────── */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Eyebrow className="mb-3">FAQ</Eyebrow>
            <h2 className="font-cv-heading text-2xl font-bold tracking-[-0.035em] sm:text-3xl">Questions owners ask first</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e3e7ed] bg-white">
            {FAQ_V4.map((faq, i) => (
              <details key={faq.q} className={`group ${i > 0 ? "border-t border-[#e3e7ed]" : ""} [&_summary::-webkit-details-marker]:hidden`}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4.5 text-sm font-bold">
                  {faq.q}
                  <svg className="h-4 w-4 shrink-0 text-[#98a2b3] transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                </summary>
                <p className="px-5 pb-4.5 text-sm leading-relaxed text-[#667085]">{faq.a}</p>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── 13. Final CTA — full-bleed panel ────────────────────────────── */}
      <section className="border-t border-[#e3e7ed] bg-[#f9fafb] px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white shadow-[0_30px_60px_-24px_rgba(28,63,168,0.5)] sm:px-12 sm:py-16" style={{ background: "linear-gradient(135deg, #2a5ae0 0%, #1c3fa8 55%, #16307e 100%)" }}>
            <h2 className="font-cv-heading mx-auto mb-4 max-w-2xl text-3xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-[42px]">
              Stop letting good leads go cold.
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-[15px] text-white/70">
              Every source captured. Every serious lead scored. Your team calling the right people back while the job is
              still up for grabs.
            </p>
            <div className="flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/sign-up" className="whitespace-nowrap rounded-xl bg-white px-6 py-3.5 text-center font-semibold text-landing-primary shadow-lg transition-colors hover:bg-[#f0f4ff]">Start your free trial</Link>
              <BookDemo className="whitespace-nowrap rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-center font-semibold text-white transition-colors hover:bg-white/20">Book a 15-min demo</BookDemo>
            </div>
            <p className="mt-5 text-[12.5px] text-white/60">14-day free trial · no contracts · real setup help</p>
          </div>
        </ScrollReveal>
      </section>

      <MarketingFooter />
      <JsonLd data={faqSchema(FAQ_V4)} />

      {/* ── Corner CTA ──────────────────────────────────────────────────── */}
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

function Cell({ v, accent = false }: { v: boolean | string; accent?: boolean }) {
  if (v === true) return <svg className={`inline h-5 w-5 ${accent ? "text-landing-primary" : "text-[#23a35a]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
  if (v === false) return <span className="inline-block h-0.5 w-4 rounded-full bg-[#d0d7e2]" />;
  return <span>{v}</span>;
}
