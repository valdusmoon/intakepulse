import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { CallTimeline, type CallBeat } from "@/components/marketing/CallTimeline";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { BrowserFrame, MediaSlot } from "@/components/marketing/MediaSlot";
import { MissedCallCalculator } from "@/components/marketing/MissedCallCalculator";
import { PricingCard } from "@/components/marketing/PricingCard";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { V4HeroScenes } from "@/components/marketing/V4HeroScenes";
import { V4StepTour } from "@/components/marketing/V4StepTour";

/**
 * /v6 — "BEST-OF HYBRID" LAYOUT DRAFT (throwaway, noindex).
 *
 * v6 is NOT a new thesis. It is an assembly: the strongest section from each of
 * the three earlier drafts, in the order that reads best end to end. Nothing
 * here is invented layout for its own sake, and all body copy is still /v2's.
 *
 * WHERE EACH SECTION CAME FROM
 *   2  Hero, dark, full-bleed video ........ /v5
 *   3  Animated app UI (V4HeroScenes) ...... /v4
 *   4  CallTimeline centrepiece ............ /v3 mechanics + /v5 spine (fused component)
 *   5  Product bento, 1 wide + 2 half ...... /v4
 *   6  Sticky step tour (V4StepTour) ....... /v4
 *   7  Expectation vs reality table ........ /v5
 *   8  Lead sources, 4-up ................... /v2
 *   9  Trade photo tiles .................... /v5 (art direction) + live homepage (assets)
 *  10  ROI calculator ...................... /v2
 *  11  Pricing + done-with-you ............. /v2
 *  12  FAQ ................................. /v2
 *  13  Final CTA, full-bleed blue .......... /v5
 *
 * WHY /v3 CONTRIBUTES NO LAYOUT. /v3's argument was right and its page was
 * wrong: 571 lines carrying a single image. Its one genuinely irreplaceable
 * idea, the transcript playing while fields extract and the score assembles, was
 * already extracted into <CallTimeline/> and fused with /v5's time-relative
 * spine. v6 inherits /v3 through that component and takes none of its design.
 *
 * THE RULE THIS DRAFT EXISTS TO ENFORCE: never text-heavy. Every band below
 * carries a visual — a built component, a real screenshot, a photo tile, a
 * frame, or a labelled slot. Two consecutive bands of icon cards and prose is
 * the specific failure this page is a correction for. If you add a section,
 * it brings a visual with it or it does not go in.
 *
 * ── BAND RHYTHM (do not break) ──────────────────────────────────────────────
 *   1  hero .................. DARK   (bg-landing-ink, full-bleed video)
 *   2  animated app UI ....... light  (white)
 *   3  the call ............. DARK   (bg-landing-ink)  ← centrepiece
 *   4  product bento ......... light  (white)
 *   5  step tour ............. light  (#f9fafb, border-y)
 *   6  expected vs actual .... light  (white)
 *   7  lead sources .......... light  (#f9fafb, border-y)
 *   8  trades ................ PAPER  (bg-landing-paper)
 *   9  the math .............. DARK   (bg-landing-ink)
 *  10  pricing ............... light  (white)
 *  11  FAQ ................... light  (white, split from 10 by a hairline rule)
 *  12  final CTA ............. BLUE   (bg-landing-primary, full-bleed)
 *
 * The dark hero sits directly on top of a light band ON PURPOSE: the software
 * appears in daylight the instant the cinematic stops, which is the transition
 * /v4 got right and /v5 never had a chance to make.
 *
 * Bands 4–7 are one long light run, which is only survivable because no two
 * adjacent members share a column structure — the constraint /v4 relied on
 * instead of dark bands:
 *      4  1 wide + 2 half           max-w-6xl
 *      5  2 col, sticky asymmetric  max-w-6xl
 *      6  1 col table               max-w-4xl
 *      7  4 col                     max-w-6xl
 * Surface tone alternates white / #f9fafb across that run as a second cue. 10
 * and 11 are deliberately one light run with no tonal break: pricing and FAQ
 * are the same "answering objections" moment, and a colour change between them
 * would read as a topic change that isn't there.
 *
 * ASSETS. Most of this page is already real. Outstanding work is the hero video
 * loop and two beat photos inside the timeline; grep "MediaSlot" for the list.
 * Already real and needing nothing generated: <V4HeroScenes/>, <V4StepTour/>,
 * <CallTimeline/>, /product/dashboard.png, /product/lead.jpg,
 * /product/reports.jpg, and all six /industries/*.jpg trade photos.
 *
 * DEVIATION FROM THE ASSEMBLY BRIEF, recorded deliberately: the two half-width
 * bento cards were specified as UI mockup slots. /product/lead.jpg and
 * /product/reports.jpg turned out to already exist as real captures of the
 * running app (they are what <ProductShowcase/> uses on the live homepage), so
 * they are used directly instead. Same for the trade tiles, which the brief
 * specified as slots annotated "asset exists". Showing a dashed box where a real
 * screenshot is sitting in /public would be the exact failure this draft is
 * meant to correct, so v6 shows the screenshots.
 */

export const metadata: Metadata = {
  title: "Callverted | Capture Every Lead, Call Back the Right Ones First",
  robots: { index: false, follow: false },
};

// Shared prompt tail so every generated photo looks like one shoot.
const SHOOT =
  "documentary trade photography, natural light, warm amber highlights against cool blue-grey shadows, 35mm, shallow depth of field, real working people mid-task, no eye contact with camera, no smiling stock poses, no on-image text or logos";

// ── Icon paths (stroke, 24-grid) ────────────────────────────────────────────
const I = {
  phone: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z",
  recover: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4",
  globe: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
} as const;

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs font-bold uppercase tracking-widest text-landing-primary ${className}`}>{children}</p>;
}

function Icon({ d, className = "h-[18px] w-[18px]" }: { d: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
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

/**
 * Band 3. Five beats handed to <CallTimeline/>. The labels are TIME-RELATIVE,
 * not numbered, because the argument of the section is that all five happen
 * inside the one call the owner already missed. The array must stay five long
 * and in order: the component keys its transcript to beat INDEX.
 *
 * Beats 1 and 4 carry photo slots so the darkest, longest band on the page is
 * not a wall of type. Do not strip them to "tighten" the section.
 */
const BEATS: CallBeat[] = [
  {
    when: "The phone rings out",
    t: "Your team is on a job. Nobody picks up.",
    d: "A burst pipe at 7pm. Your crew is elbow-deep in someone else's basement and the phone is in the van. You keep your phones either way: you publish one Callverted number and it rings your team first, every time.",
    media: {
      title: "Beat 1 photo: the unanswered phone",
      note: "A phone lighting up unanswered on the seat of a work van while the crew works out of frame.",
      dims: "1400×1050 · webp · 4:3",
      prompt: `A mobile phone face-up on the passenger seat of a plumber's work van, screen lit with an incoming call, cluttered with pipe fittings and a clipboard, van door open onto a suburban driveway at dusk, nobody in the seat, ${SHOOT}, 4:3`,
    },
  },
  {
    when: "Callverted picks up",
    t: "It answers live and asks what a dispatcher would ask.",
    d: "What happened, where, and how urgent. A few questions, not an interrogation. If the caller already said it's a burst pipe in the kitchen, it doesn't ask again. It listens first, then asks only for what's missing.",
  },
  {
    when: "Still on the call",
    t: "Any price comes from your rules, word for word.",
    d: "Only prices you approved, repeated exactly as you wrote them. Anything else and it says your team will follow up with a quote. It never invents a number.",
  },
  {
    when: "Before they hang up",
    t: "It repeats the problem back and names your business.",
    d: "Their problem, in its own words, then your business name, then a reason to wait for your callback instead of calling around. That pause is the window your team needs to reach them first.",
    media: {
      title: "Beat 4 photo: the caller, reassured",
      note: "The homeowner end of the same call. Relief, not delight.",
      dims: "1400×1050 · webp · 4:3",
      prompt: `A homeowner in their forties standing at the top of basement stairs holding a phone to their ear, shoulders dropping in relief, wet cardboard boxes and a running sump pump visible below, single overhead bulb, ${SHOOT}, 4:3`,
    },
  },
  {
    when: "60 seconds later",
    t: "The lead is scored and it's already on your phone.",
    d: "Missed calls, answered calls, and website inquiries all become the same lead record: the job, the estimated value, and how fast to call back. One list, ranked by who to call first.",
  },
];

/** Band 6. Expectation vs reality. Pure HTML/CSS, no images, no icons beyond the marks. */
const COMPARE_ROWS = [
  { expects: "Someone picks up", actual: "It rings out. Everyone is on a job" },
  { expects: "A person who understands the problem", actual: "A voicemail beep and dead air" },
  { expects: "Some idea what this will cost", actual: "No number, no callback window" },
  { expects: "To be told what happens next", actual: "No idea if anyone got the message" },
  { expects: "A callback while it still matters", actual: "A callback tomorrow, if at all" },
  { expects: "To stop calling around", actual: "They dial the next company on Google" },
];

const SOURCES = [
  {
    icon: I.phone,
    t: "Missed-call recovery",
    d: "Your team misses the call. Callverted answers live and qualifies the job on the spot.",
  },
  {
    icon: I.recover,
    t: "Answered-call capture",
    d: "Switch it on and the calls your team takes get summarized and scored too. Details stop living in someone's head.",
  },
  {
    icon: I.globe,
    t: "Website widget",
    d: "One line of code adds intake to your site. Visitors describe the job before they bounce.",
  },
  {
    icon: I.link,
    t: "Direct intake link",
    d: "One link for ads, your Google profile, texts, and social. Every submission gets qualified the same way.",
  },
];

/**
 * Band 8. Every one of these photos is ALREADY LIVE on the homepage at
 * /industries/<slug>.jpg, so this band is zero-cost: nothing to generate,
 * nothing to approve, and it is the most photographic band on the page.
 */
const TRADES = [
  { name: "Restoration", href: "/industries/restoration", img: "/industries/restoration.jpg" },
  { name: "HVAC", href: "/industries/hvac", img: "/industries/hvac.jpg" },
  { name: "Plumbing", href: "/industries/plumbing", img: "/industries/plumbing.jpg" },
  { name: "Electrical", href: "/industries/electrical", img: "/industries/electrical.jpg" },
  { name: "General contracting", href: "/industries/general-contracting", img: "/industries/general-contracting.jpg" },
  { name: "Your trade", href: "/industries", img: "/industries/your-trade.jpg" },
];

const TRUST = [
  "We build your call flow and lead sources with you",
  "You approve every service, price, and question before launch",
  "We run test calls together before a customer ever hears it",
  "A real person helps you tune it after launch",
];

const FAQ_V2 = [
  {
    q: "Is this just an AI receptionist?",
    a: "No. An answering service takes a message. Callverted qualifies the job, scores the lead, and tells your team who to call back first. It also captures answered calls and website inquiries, not just missed ones.",
  },
  {
    q: "Does it replace my phone number?",
    a: "No. You publish a Callverted number that rings your team first on every call. Callverted only steps in when nobody picks up.",
  },
  {
    q: "What happens when my team answers?",
    a: "If you switch on answered-call capture, the call is transcribed, summarized, and scored, so the details are saved instead of disappearing after hangup. The audio itself is deleted once transcribed, never stored.",
  },
  {
    q: "Can it qualify website leads too?",
    a: "Yes. Add the website widget or share your intake link. Those submissions go through the same qualification and scoring as phone calls.",
  },
  {
    q: "Will the AI make up prices?",
    a: "Never. Callers only hear pricing you approved, word for word. If there is no approved price, it says your team will follow up with a quote.",
  },
  {
    q: "How fast can we launch?",
    a: "About 30 minutes of setup: call flow, service area, pricing rules, and test calls. We walk through it with you.",
  },
];

export default function V6Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v6logo" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#story" className="hidden font-medium text-white/90 transition-colors hover:text-white md:block">
            How it works
          </a>
          <a href="#product" className="hidden font-medium text-white/90 transition-colors hover:text-white lg:block">
            Product
          </a>
          <a href="#pricing" className="hidden font-medium text-white/90 transition-colors hover:text-white sm:block">
            Pricing
          </a>
          <BookDemo className="hidden font-medium text-white/90 transition-colors hover:text-white md:block">
            Book a demo
          </BookDemo>
          <AuthAwareNavCta />
        </div>
      </LandingNavShell>

      {/* ═══ BAND 1 · DARK · Hero over full-bleed video ═══════════════════════
          From /v5. The video wrapper is sized 177.78vh × 56.25vw so a 16:9 asset
          always overfills the viewport at any aspect ratio, then it is centred on
          both axes. The overflow-hidden on <section> is the ONLY thing stopping
          that excess width from creating a horizontal scrollbar on narrow
          screens. Do not remove it, and re-check mobile if you touch it. */}
      <section className="relative flex min-h-[92vh] items-center overflow-hidden bg-landing-ink py-20 sm:py-28">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ width: "177.78vh", height: "56.25vw", minWidth: "100%", minHeight: "100%" }}
          aria-hidden
        >
          <MediaSlot
            kind="video"
            dark
            className="h-full w-full"
            title="Hero background loop"
            note="Silent, seamless 8-12s loop. Slow push-in, low contrast so overlaid copy stays readable."
            dims="1920×1080 · mp4 + webm · muted loop"
            prompt={`Slow cinematic push-in on a restoration crew unloading air movers from a van outside a house at blue hour, porch light on, breath visible in cold air, handheld micro-movement, ${SHOOT}, 16:9, no cuts`}
          />
        </div>
        {/* scrim: keeps the copy legible whatever the video is doing underneath */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{
            background:
              "linear-gradient(100deg, rgba(6,10,20,0.94) 0%, rgba(6,10,20,0.82) 42%, rgba(6,10,20,0.55) 72%, rgba(6,10,20,0.7) 100%)",
          }}
        />
        <div
          className="pointer-events-none absolute -top-24 right-[6%] h-[420px] w-[420px] rounded-full bg-landing-primary/25 blur-[120px]"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-6xl px-6 pt-16">
          <div className="max-w-2xl">
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-landing-primary-glow" /> Built for restoration, HVAC,
              plumbing, and electrical
            </span>
            <h1 className="font-cv-heading mb-6 text-[44px] font-bold leading-[0.98] tracking-[-0.035em] text-white sm:text-[64px]">
              Capture every lead. Call back the right ones first.
            </h1>
            <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/70">
              Callverted answers the calls your team misses, captures the ones they take, and qualifies every website
              inquiry. Each lead is scored and ranked, so your team knows which jobs need the fastest callback.
            </p>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sign-up"
                className="rounded-xl bg-landing-primary px-7 py-3.5 text-center font-semibold text-white shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)] transition-colors hover:bg-blue-600"
              >
                Start your free trial
              </Link>
              <BookDemo className="rounded-xl border border-white/20 bg-white/10 px-7 py-3.5 text-center font-medium text-white backdrop-blur transition-colors hover:bg-white/20">
                Book a demo
              </BookDemo>
            </div>
            <p className="text-[12.5px] font-medium text-white/50">
              14-day free trial · your phones ring first · no per-lead fees
            </p>
          </div>
        </div>
      </section>

      {/* ═══ BAND 2 · LIGHT · The software, in daylight ═══════════════════════
          From /v4. <V4HeroScenes/> is BUILT, not a placeholder: the three-beat
          product story (call → intake → ranked lead) animating as light app UI
          inside browser chrome. Putting it directly under the dark cinematic
          hero is the whole point of the pairing — the film stops, the product
          appears, and the reader sees the actual screens within one scroll. */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mx-auto mb-12 max-w-2xl text-center">
            <Eyebrow className="mb-3">The software</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[44px]">
              Every missed call, answered call, and web inquiry ends up here.
            </h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">
              One scored lead in one ranked list. Watch a call become a record your team can work.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={120} className="mx-auto max-w-5xl">
            <V4HeroScenes />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ BAND 3 · DARK · CENTREPIECE — one call, played through ═══════════
          The spine of the page and its best section. <CallTimeline/> is audio-
          driven: press play and five time-relative beats advance in sync with
          the transcript while intake fields extract and the priority score
          assembles, ending on the push alert the owner receives. That is /v3's
          mechanic on /v5's spine, and it is the one thing on this page a
          competitor cannot answer with a screenshot.

          BEATS is passed in so this band keeps its own copy and its two photo
          slots rather than falling back to the component's lean defaults. */}
      <section id="story" className="scroll-mt-20 bg-landing-ink px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <ScrollReveal className="mb-14 max-w-2xl">
            <Eyebrow className="mb-3">One call, start to finish</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] text-white sm:text-[44px]">
              From first ring to ranked lead, inside a single call.
            </h2>
            <p className="text-[16px] leading-relaxed text-white/60">
              Not a workflow you have to run. This is what happens on the call your team already missed, in the sixty
              seconds before the caller decides to try someone else.
            </p>
          </ScrollReveal>

          <ScrollReveal>
            {/* Only `when` + `t` go in. Passing the `d` paragraphs and the beat
                photos makes every beat state its point twice, once as prose and
                once as the dialogue underneath it, and the section balloons.
                The beat titles label, the transcript proves. Keep it this way. */}
            <CallTimeline beats={BEATS.map(({ when, t }) => ({ when, t }))} />
          </ScrollReveal>

          <ScrollReveal delay={90} className="mt-8 max-w-md">
            <p className="font-cv-heading text-[16px] font-bold text-white">The part nobody else can send you.</p>
            <p className="mt-2 text-[13.5px] leading-relaxed text-white/60">
              Hot, Warm, or Cool, scored on urgency, job value, and lead quality. A message tells you someone called.
              This tells you whether to stop what you&apos;re doing.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ BAND 4 · LIGHT (white) · Product bento, 1 wide + 2 half ══════════
          From /v4, including its caption-above-title card pattern. All three
          cards now carry REAL screenshots of the running app rather than
          mockups, which is the single biggest "is this real?" lift available to
          this page and costs nothing. */}
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

          {/* Wide card — real dashboard capture, roughly 2x the height of a half */}
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
              <BrowserFrame url="app.callverted.com/leads">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/product/lead.jpg"
                  alt="A qualified lead with the AI opportunity summary, recommended actions, qualification answers, and outcome logging"
                  width={1600}
                  height={1056}
                  className="h-auto w-full"
                />
              </BrowserFrame>
            </ScrollReveal>

            <ScrollReveal delay={160} className="rounded-3xl border border-[#e3e7ed] bg-[#f9fafb] p-5 sm:p-7">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[#98a2b3]">Weekly recap</p>
              <h3 className="font-cv-heading mb-2 text-lg font-bold tracking-[-0.02em] sm:text-xl">
                You find out what the phone is actually worth.
              </h3>
              <p className="mb-5 text-[13.5px] leading-relaxed text-[#667085]">
                What came in, from which source, how fast it got called back, and what it was worth. The leak stops
                being a feeling and starts being a number.
              </p>
              <BrowserFrame url="app.callverted.com/reports">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/product/reports.jpg"
                  alt="Reports: overflow calls captured, a captured-versus-won chart, the conversion funnel, and performance by channel"
                  width={1600}
                  height={1044}
                  className="h-auto w-full"
                />
              </BrowserFrame>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ BAND 5 · LIGHT (#f9fafb) · Sticky step tour ══════════════════════
          From /v4. Two-column sticky asymmetric split, so it does not read as
          the same shape as the bento above it despite both being light. */}
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

      {/* ═══ BAND 6 · LIGHT (white) · What they expect vs what happens ════════
          From /v5. A real table on desktop, stacked pairs on mobile so nothing
          ever scrolls sideways. One-column max-w-4xl, which is the narrowest
          measure in the light run and breaks the two wide grids either side. */}
      <section className="bg-white px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-4xl">
          <ScrollReveal className="mb-10 max-w-2xl">
            <Eyebrow className="mb-3">The gap</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[44px]">
              Nobody calls a plumber hoping to leave a message.
            </h2>
            <p className="text-[16px] leading-relaxed text-[#667085]">
              The homeowner has one job in mind when they dial. Here is what they came for, and what they usually get
              instead.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={90}>
            {/* desktop: a real two-column table */}
            <div className="hidden overflow-hidden rounded-3xl border border-[#e3e7ed] sm:block">
              <div className="grid grid-cols-2 border-b border-[#e3e7ed] bg-[#f9fafb]">
                <div className="px-6 py-4 text-[13px] font-bold text-[#152033]">What the homeowner expects</div>
                <div className="border-l border-[#e3e7ed] px-6 py-4 text-[13px] font-bold text-[#152033]">
                  What usually happens
                </div>
              </div>
              {COMPARE_ROWS.map((r, i) => (
                <div key={r.expects} className={`grid grid-cols-2 ${i > 0 ? "border-t border-[#eef1f4]" : ""}`}>
                  <div className="flex items-start gap-3 px-6 py-4">
                    <Tick />
                    <span className="text-[14px] leading-snug text-[#152033]">{r.expects}</span>
                  </div>
                  <div className="flex items-start gap-3 border-l border-[#e3e7ed] bg-[#fffafa] px-6 py-4">
                    <Cross />
                    <span className="text-[14px] leading-snug text-[#667085]">{r.actual}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* mobile: stacked pairs */}
            <div className="space-y-3 sm:hidden">
              {COMPARE_ROWS.map((r) => (
                <div key={r.expects} className="overflow-hidden rounded-2xl border border-[#e3e7ed]">
                  <div className="flex items-start gap-3 bg-white px-4 py-3.5">
                    <Tick />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#98a2b3]">Expects</p>
                      <p className="text-[14px] leading-snug text-[#152033]">{r.expects}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 border-t border-[#eef1f4] bg-[#fffafa] px-4 py-3.5">
                    <Cross />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#c98a8a]">Gets</p>
                      <p className="text-[14px] leading-snug text-[#667085]">{r.actual}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ BAND 7 · LIGHT (#f9fafb) · Lead sources, 4-up ════════════════════
          From /v2. The only icon-card grid on the page, and it is allowed
          exactly once because it sits between a table and a photo wall. */}
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

      {/* ═══ BAND 8 · PAPER · Built for urgent trades ═════════════════════════
          Art direction from /v5 (photo, gradient scrim, name overlaid in HTML,
          arrow on hover), assets from the live homepage. ZERO COST: all six
          /industries/*.jpg files already exist and ship today. */}
      <section id="trades" className="scroll-mt-20 border-y border-[#e3e7ed] bg-landing-paper px-6 py-20 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <ScrollReveal className="mb-10 max-w-2xl">
            <Eyebrow className="mb-3">Built for urgent trades</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[40px]">
              Tuned to how your jobs actually come in.
            </h2>
            <p className="text-[15px] leading-relaxed text-[#667085]">
              Restoration, HVAC, plumbing, electrical, and contracting jobs come in differently. Your intake questions,
              pricing, and urgency rules match your trade.
            </p>
          </ScrollReveal>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRADES.map((t, i) => (
              <ScrollReveal
                key={t.name}
                delay={(i % 3) * 80}
                className="group relative block overflow-hidden rounded-2xl border border-[#e3e7ed] transition-shadow hover:shadow-[0_18px_40px_-16px_rgba(16,24,40,.35)]"
              >
                <Link href={t.href} className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={t.img}
                    alt={t.name}
                    className="h-44 w-full object-cover object-[50%_32%] transition-transform duration-500 group-hover:scale-[1.05] sm:h-48"
                  />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-cv-heading text-[15px] font-bold text-white drop-shadow-sm">{t.name}</span>
                      <span className="flex -translate-x-1 items-center gap-1 text-[12px] font-semibold text-white/0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-white">
                        {t.name === "Your trade" ? "See all" : "Learn more"}
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.5"
                        >
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BAND 9 · DARK · The math ═════════════════════════════════════════
          From /v2, mounted the way /v2 mounts it: the calculator in a dark
          rounded card. Here the whole band is dark, so the card is the raised
          surface rather than the dark note in a light band. */}
      <section className="bg-landing-ink px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
          <div>
            <Eyebrow className="mb-3">The math</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] text-white sm:text-[42px]">
              What are slow callbacks costing you?
            </h2>
            <p className="max-w-md text-[15px] leading-relaxed text-white/60">
              Missed calls are easy to measure. Slow follow-up is the bigger leak.
            </p>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-landing-ink-raised p-6 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.8)] sm:p-7">
            <MissedCallCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ BAND 10 · LIGHT · Pricing + done-with-you ════════════════════════ */}
      <section id="pricing" className="scroll-mt-20 bg-white px-6 py-20 sm:py-24">
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
                    <svg
                      className="h-3.5 w-3.5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  </span>
                  <p className="text-[15px] font-semibold leading-snug text-[#344054]">{t}</p>
                </div>
              ))}
            </div>
            <div className="mt-8">
              <MediaSlot
                kind="image"
                className="aspect-[16/10]"
                title="Setup-call photo"
                note="ASSET PARTIALLY EXISTS — /team/nile.jpg is the founder headshot; this is a wider working shot of the same person."
                dims="1600×1000 · webp · 16:10"
                prompt={`A man in his thirties at a small home-office desk on a headset call, dual monitors showing a simple dashboard, notepad of handwritten call-flow notes beside the keyboard, warm desk lamp against a grey morning window, ${SHOOT}, 16:10`}
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ BAND 11 · LIGHT · FAQ (same light run as band 10) ════════════════ */}
      <section className="border-t border-[#eef1f4] bg-white px-6 py-20 sm:py-24">
        <ScrollReveal className="mx-auto max-w-2xl">
          <div className="mb-8 text-center">
            <Eyebrow className="mb-3">FAQ</Eyebrow>
            <h2 className="font-cv-heading text-2xl font-bold tracking-[-0.035em] sm:text-3xl">
              Questions owners ask first
            </h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-[#e3e7ed] bg-white">
            {FAQ_V2.map((faq, i) => (
              <details
                key={faq.q}
                className={`group ${i > 0 ? "border-t border-[#e3e7ed]" : ""} [&_summary::-webkit-details-marker]:hidden`}
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4.5 text-sm font-bold">
                  {faq.q}
                  <svg
                    className="h-4 w-4 shrink-0 text-[#98a2b3] transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-5 pb-4.5 text-sm leading-relaxed text-[#667085]">{faq.a}</p>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ BAND 12 · BLUE · Final CTA, full-bleed ═══════════════════════════
          From /v5. The only place on the page where the brand blue fills the
          entire viewport width. That is what makes the closer land, so do not
          wrap this back into a rounded card the way /v2 and /v4 do. */}
      <section className="relative overflow-hidden bg-landing-primary px-6 py-20 text-white sm:py-24">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden
          style={{ background: "linear-gradient(135deg, #2a5ae0 0%, #1c3fa8 60%, #16307e 100%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-32 left-[12%] h-[420px] w-[420px] rounded-full bg-landing-primary-glow/30 blur-[130px]"
          aria-hidden
        />
        <ScrollReveal className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-cv-heading mx-auto mb-4 max-w-2xl text-3xl font-bold leading-[1.05] tracking-[-0.035em] sm:text-[46px]">
            Stop letting good leads go cold.
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-[15px] text-white/75">
            Every source captured. Every serious lead scored. Your team calling the right people back while the job is
            still up for grabs.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/sign-up"
              className="whitespace-nowrap rounded-xl bg-white px-6 py-3.5 text-center font-semibold text-landing-primary shadow-lg transition-colors hover:bg-[#f0f4ff]"
            >
              Start your free trial
            </Link>
            <BookDemo className="whitespace-nowrap rounded-xl border border-white/40 bg-white/10 px-6 py-3.5 text-center font-semibold text-white transition-colors hover:bg-white/20">
              Book a 15-min demo
            </BookDemo>
          </div>
          <p className="mt-5 text-[12.5px] text-white/60">14-day free trial · no contracts · real setup help</p>
        </ScrollReveal>
      </section>

      <MarketingFooter />
      <JsonLd data={faqSchema(FAQ_V2)} />

      {/* ── Corner CTA (carried over from /v2) ───────────────────────────── */}
      <BookDemo
        title="Questions before you start?"
        blurb="Book a quick call or leave your details — a real person (not a bot) will get back to you, usually same day."
        className="fixed bottom-5 right-5 z-50 hidden items-center gap-2.5 rounded-full bg-landing-primary py-3 pl-4 pr-5 text-white shadow-[0_12px_30px_-8px_rgba(36,84,216,0.6)] transition-colors hover:bg-blue-600 sm:flex"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d={I.chat} />
        </svg>
        <span className="text-sm font-semibold">Questions? Talk to us</span>
      </BookDemo>
    </div>
  );
}

function Tick() {
  return (
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#e9f8ef] text-[#23a35a]">
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

function Cross() {
  return (
    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#fff1f0] text-[#e5484d]">
      <svg
        className="h-3 w-3"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </span>
  );
}
