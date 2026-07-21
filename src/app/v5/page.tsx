import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { CallTimeline } from "@/components/marketing/CallTimeline";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { AudioSlot, MediaSlot } from "@/components/marketing/MediaSlot";
import { MissedCallCalculator } from "@/components/marketing/MissedCallCalculator";
import { PricingCard } from "@/components/marketing/PricingCard";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";

/**
 * /v5 — "NARRATIVE" LAYOUT DRAFT (throwaway, noindex).
 *
 * Same approved copy as /v2, re-laid-out around one idea: the page tells the
 * story of a single call instead of listing features. The centrepiece is a
 * vertical timeline whose beats are stamped with TIME-RELATIVE labels
 * ("STILL ON THE CALL", "BEFORE THEY HANG UP") rather than "Step 1/2/3",
 * because the whole argument is that all of this happens inside one call the
 * owner already lost. The payoff beat is a phone showing the lead alert with
 * its scored priority tier, which is the thing an answering service or a
 * text-back tool structurally cannot show.
 *
 * How it differs from /v2: v2 is a 13-section feature argument on white with no
 * photography. v5 is story-led and photo-led, and it drops v2's lead-sources
 * grid, extraction demo, lead-packet grid and comparison matrix in favour of
 * one narrative spine plus a plain expectation-vs-reality table. Everything
 * that survives is copy lifted from v2, adapted only in voice.
 *
 * ── BAND RHYTHM (do not break) ──────────────────────────────────────────────
 * Every band is exactly one idea, full-bleed, at IDENTICAL vertical padding
 * (`py-20 sm:py-28`), and the background alternates on a fixed cycle:
 *
 *   1  hero .................. DARK   (bg-landing-ink, full-bleed video)
 *   2  problem checklist ..... light  (white)
 *   3  one call, start to end . DARK   (bg-landing-ink)  ← centrepiece
 *   4  expected vs actual .... light  (white)
 *   5  trades ................ PAPER  (bg-landing-paper)
 *   6  what the caller hears . light  (white)
 *   7  the math .............. DARK   (bg-landing-ink)
 *   8  pricing ............... light  (white)
 *   9  FAQ ................... light  (white, split from 8 by a hairline rule)
 *  10  final CTA ............. BLUE   (bg-landing-primary, full-bleed)
 *      footer
 *
 * The payoff of the rhythm is that any band can be deleted whole without
 * touching its neighbours, as long as you keep two DARK bands from ending up
 * adjacent. 8 and 9 are deliberately one light run: pricing and FAQ are the
 * same "answering objections" moment and a colour change between them reads as
 * a topic change that isn't there.
 *
 * Assets: NOTHING here is a real asset except the shared components. Every
 * photo/video/audio is a <MediaSlot>/<AudioSlot> carrying its own generation
 * prompt. Grep "MediaSlot" to find what's outstanding. The /industries/*.jpg
 * photos already exist on the live homepage and are noted as reusable.
 */

export const metadata: Metadata = {
  title: "Callverted | One Call, From Ring-Out to Ranked Lead",
  robots: { index: false, follow: false },
};

// Shared prompt tail so every generated photo looks like one shoot.
const SHOOT =
  "documentary trade photography, natural light, warm amber highlights against cool blue-grey shadows, 35mm, shallow depth of field, real working people mid-task, no eye contact with camera, no smiling stock poses, no on-image text or logos";

// ── Icon paths (stroke, 24-grid) ────────────────────────────────────────────
const I = {
  phone: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z",
  missed: "M18 6 6 18M6 6l12 12",
  recover: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4",
  check: "M20 6 9 17l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  globe: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  chat: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  clock: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zM12 7v5l3.5 2",
  notepad: "M8 3h8a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2V5a2 2 0 0 1 2-2zM9 8h6M9 12h6",
} as const;

function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={`text-xs font-bold uppercase tracking-widest text-landing-primary ${className}`}>{children}</p>
  );
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

// ── Section data (copy carried over from /v2) ───────────────────────────────

/**
 * Band 2. PURE problems only. TradeLead's version of this block smuggles
 * benefits in under the same checkmark ("instant AI responses!") which kills
 * the whole device, because the reader stops trusting that a tick means "this
 * is what's happening to you". Every line below is something going wrong.
 * Drawn from v2's LEAK_CARDS plus the answered-call and web-form leaks.
 */
const PROBLEMS = [
  { icon: I.missed, t: "The phone rings out and you never find out they called." },
  { icon: I.arrow, t: "They hang up and dial the next company on Google." },
  { icon: I.phone, t: "Your tech takes the call between jobs and nothing gets written down." },
  { icon: I.notepad, t: "The name, the job, and the callback live in someone's head until they don't." },
  { icon: I.globe, t: "A web form sits in an inbox all afternoon." },
  { icon: I.clock, t: "By the time someone replies, the job is booked elsewhere." },
];

/**
 * Band 3, the centrepiece. Beats are TIME-RELATIVE, not numbered: the point of
 * the section is that all five happen inside the one call the owner missed.
 * Body copy is v2's STEPS, re-voiced from noun-labels ("Capture", "Qualify")
 * into moments.
 */
type Beat = {
  when: string;
  icon: string;
  t: string;
  d: string;
  media?: { title: string; note: string; prompt: string; dims: string };
};

const BEATS: Beat[] = [
  {
    when: "The phone rings out",
    icon: I.missed,
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
    icon: I.phone,
    t: "It answers live and asks what a dispatcher would ask.",
    d: "What happened, where, and how urgent. A few questions, not an interrogation. If the caller already said it's a burst pipe in the kitchen, it doesn't ask again. It listens first, then asks only for what's missing.",
  },
  {
    when: "Still on the call",
    icon: I.dollar,
    t: "Any price comes from your rules, word for word.",
    d: "Only prices you approved, repeated exactly as you wrote them. Anything else and it says your team will follow up with a quote. It never invents a number.",
  },
  {
    when: "Before they hang up",
    icon: I.chat,
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
    icon: I.bell,
    t: "The lead is scored and it's already on your phone.",
    d: "Missed calls, answered calls, and website inquiries all become the same lead record: the job, the estimated value, and how fast to call back. One list, ranked by who to call first.",
  },
];

/**
 * Band 4. Expectation vs reality, six rows, no images. This is the block that
 * earns the timeline: it states the gap the timeline closes.
 */
const COMPARE_ROWS = [
  { expects: "Someone picks up", actual: "It rings out. Everyone is on a job" },
  { expects: "A person who understands the problem", actual: "A voicemail beep and dead air" },
  { expects: "Some idea what this will cost", actual: "No number, no callback window" },
  { expects: "To be told what happens next", actual: "No idea if anyone got the message" },
  { expects: "A callback while it still matters", actual: "A callback tomorrow, if at all" },
  { expects: "To stop calling around", actual: "They dial the next company on Google" },
];

const TRADES = [
  {
    name: "Restoration",
    href: "/industries/restoration",
    prompt: `A restoration technician in a respirator running an air mover in a flooded basement, standing water reflecting work lights, ${SHOOT}, 4:3`,
  },
  {
    name: "HVAC",
    href: "/industries/hvac",
    prompt: `An HVAC technician kneeling beside a rooftop condenser unit with a manifold gauge set, late afternoon sun across the roof deck, ${SHOOT}, 4:3`,
  },
  {
    name: "Plumbing",
    href: "/industries/plumbing",
    prompt: `A plumber lying under a kitchen sink tightening a compression fitting, headlamp lighting the cabinet interior, water pooled on the tile, ${SHOOT}, 4:3`,
  },
  {
    name: "Electrical",
    href: "/industries/electrical",
    prompt: `An electrician testing a residential breaker panel with a multimeter, work light clipped to the panel door, garage in shadow behind, ${SHOOT}, 4:3`,
  },
  {
    name: "General contracting",
    href: "/industries/general-contracting",
    prompt: `A general contractor in a dusty flannel reviewing framing plans on a half-built interior, stud walls and morning light through plastic sheeting, ${SHOOT}, 4:3`,
  },
  {
    name: "Your trade",
    href: "/industries",
    prompt: `Three service vans in a small contractor's yard at first light, roll-up doors open, tools being loaded, no visible branding, ${SHOOT}, 4:3`,
  },
];

const ASSURANCE = [
  "Their problem is repeated back, so they know it landed",
  "Your business name is what they remember, not ours",
  "It never promises a price or an arrival time on your behalf",
  "Every caller hears something, even at 2am",
  "Every channel ends the same way, phone or web",
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

export default function V5Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033]">
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v5logo" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#story" className="hidden font-medium text-white/90 transition-colors hover:text-white md:block">
            How it works
          </a>
          <a href="#trades" className="hidden font-medium text-white/90 transition-colors hover:text-white lg:block">
            Trades
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

      {/* ═══ BAND 1 · DARK · Hero over full-bleed video ═════════════════════
          The video wrapper is sized 177.78vh × 56.25vw so a 16:9 asset always
          overfills the viewport at any aspect, then centred on both axes. The
          overflow-hidden on <section> is what stops the excess width from
          creating a horizontal scrollbar — do not remove it. */}
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
        {/* scrim: keeps the copy legible whatever the video does */}
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

      {/* ═══ BAND 2 · LIGHT · The problem checklist ═════════════════════════ */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-[1.08fr_0.92fr] lg:gap-14">
            <ScrollReveal>
              <Eyebrow className="mb-3">The leak</Eyebrow>
              <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[44px]">
                Every missed call is a customer dialing your competitor next.
              </h2>
              <p className="mb-9 max-w-xl text-[16px] leading-relaxed text-[#667085]">
                A burst pipe at 7pm. Your crew is on a job, the phone rings out, and the homeowner calls the next
                number on Google. Answered calls leak too: the details live in someone&apos;s head until they
                don&apos;t.
              </p>
              <ul className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                {PROBLEMS.map((p) => (
                  <li key={p.t} className="flex items-start gap-3">
                    <span className="mt-px grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-[#fff1f0] text-[#e5484d]">
                      <Icon d={p.icon} className="h-3.5 w-3.5" />
                    </span>
                    <p className="text-[14px] leading-snug text-[#344054]">{p.t}</p>
                  </li>
                ))}
              </ul>
            </ScrollReveal>

            <ScrollReveal delay={110}>
              <MediaSlot
                kind="image"
                className="aspect-[4/5]"
                title="The leak photo"
                note="Tradesperson mid-job, physically unable to reach a ringing phone. This is the emotional anchor of the band."
                dims="1200×1500 · webp · 4:5"
                prompt={`A plumber on their back under a sink with both hands on a wrench, a phone buzzing face-up on the tile just out of reach, water on the floor catching the work light, cramped cabinet interior, ${SHOOT}, 4:5 portrait`}
              />
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ═══ BAND 3 · DARK · CENTREPIECE — one call, start to finish ════════
          Single-column timeline with a connecting spine and circular nodes.
          Labels are time-relative on purpose. Do not renumber them. */}
      <section id="story" className="scroll-mt-20 bg-landing-ink px-6 py-20 sm:py-28">
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

          {/* The timeline is AUDIO-DRIVEN: press play and the beats advance in
              sync with the transcript, ending on the alert. Beat copy (including
              the two photo slots) still lives in BEATS above, so this section
              keeps its visual weight; only the playback mechanic is shared. */}
          <ScrollReveal>
            {/* Only `when` + `t` go in. The `d` paragraphs and the two photo
                slots on BEATS are deliberately NOT passed: once the transcript
                plays underneath each beat, a paragraph explaining the same beat
                states the point twice and the section balloons. The beat titles
                label, the dialogue proves.
                The band still carries plenty of visual weight without the photos
                (transport bar, phone frame, score bars, field cards), so they are
                dropped rather than relocated. The two `media` entries remain on
                BEATS, unused, if a photo is ever wanted back here. */}
            <CallTimeline beats={BEATS.map(({ when, t }) => ({ when, t }))} />
          </ScrollReveal>

          <ScrollReveal delay={90} className="mt-7">
            <p className="max-w-lg text-[14px] leading-relaxed text-white/50">
              A message tells you someone called. This tells you whether to stop what you&apos;re doing.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ BAND 4 · LIGHT · What they expect vs what happens ══════════════ */}
      <section className="bg-white px-6 py-20 sm:py-28">
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

            {/* mobile: stacked pairs, so nothing ever scrolls sideways */}
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

      {/* ═══ BAND 5 · PAPER · Built for urgent trades ═══════════════════════ */}
      <section
        id="trades"
        className="scroll-mt-20 border-y border-[#e3e7ed] bg-landing-paper px-6 py-20 sm:py-28"
      >
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

          {/* Photo tiles follow the live homepage treatment: photo, gradient
              scrim, name overlaid in HTML, arrow on hover. The MediaSlot stands
              in for the <img> at the same aspect. */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TRADES.map((t, i) => {
              const slug = t.href.split("/").pop() || "your-trade";
              return (
                <ScrollReveal key={t.name} delay={(i % 3) * 80}>
                  <Link
                    href={t.href}
                    className="group relative block overflow-hidden rounded-2xl border border-[#e3e7ed] transition-shadow hover:shadow-[0_18px_40px_-16px_rgba(16,24,40,.35)]"
                  >
                    {/* pb-14 keeps the slot's prompt clear of the name bar overlaid below */}
                    <MediaSlot
                      kind="image"
                      className="h-60 pb-14"
                      title={`Trade tile: ${t.name}`}
                      note={`ASSET EXISTS — /industries/${slug}.jpg is already live on the homepage and can be reused as-is.`}
                      dims="1200×900 · webp · 4:3"
                      prompt={t.prompt}
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-cv-heading text-[15px] font-bold text-white drop-shadow-sm">
                          {t.name}
                        </span>
                        <span className="flex -translate-x-1 items-center gap-1 text-[12px] font-semibold text-white/0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-white">
                          {t.name === "Your trade" ? "See all" : "Learn more"}
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M13 6l6 6-6 6" />
                          </svg>
                        </span>
                      </div>
                    </div>
                  </Link>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══ BAND 6 · LIGHT · What your customer hears ══════════════════════ */}
      <section className="bg-white px-6 py-20 sm:py-28">
        <div className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-10 lg:grid-cols-[1fr_0.9fr] lg:gap-14">
          <ScrollReveal>
            <Eyebrow className="mb-3">What your customer hears</Eyebrow>
            <h2 className="font-cv-heading mb-4 text-3xl font-bold leading-[1.03] tracking-[-0.035em] sm:text-[40px]">
              They hang up knowing you got it.
            </h2>
            <p className="mb-6 text-[15px] leading-relaxed text-[#667085]">
              No voicemail beep, no dead air. Callverted repeats their problem back in its own words, names your
              business, and tells them your team already has it. They have a reason to wait for your callback instead
              of calling around, which is the window your team needs to win the job.
            </p>
            <div className="space-y-3">
              {ASSURANCE.map((a) => (
                <div key={a} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
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
                  <p className="text-[14px] leading-snug text-[#344054]">{a}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>

          <ScrollReveal delay={90} className="space-y-4">
            <div className="rounded-2xl border border-[#e3e7ed] bg-[#f9fafb] p-6 shadow-[0_18px_45px_-24px_rgba(16,24,40,.35)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-landing-primary/10 text-landing-primary">
                  <Icon d={I.phone} className="h-4 w-4" />
                </span>
                <p className="text-[11px] font-bold uppercase tracking-widest text-[#98a2b3]">End of call</p>
              </div>
              <p className="font-cv-body text-[15px] leading-relaxed text-[#152033]">
                &ldquo;Sarah, we understand you&apos;re dealing with water coming into the basement, and that must be
                stressful. The team at <span className="font-semibold">Blue Star Restoration</span> has been notified
                and will get back to you as soon as possible. Please wait for our callback.&rdquo;
              </p>
              <p className="mt-4 border-t border-[#e3e7ed] pt-4 text-[12.5px] text-[#667085]">
                Website and intake-link submissions end the same way on screen, written from what that person actually
                typed rather than the same thank-you everyone else gets.
              </p>
            </div>

            {/* hearing it is more convincing than reading it */}
            <AudioSlot
              title="Hear the same line spoken"
              note="Real TTS render of the closing line above, taken from a live test call."
              duration="0:14"
              prompt="Record/export the end-of-call reassurance for the Blue Star Restoration test flow, water-damage scenario, caller name Sarah. Same voice the product ships with. Trim to the closing turn only, normalize to -16 LUFS, export mp3 + m4a."
            />
          </ScrollReveal>
        </div>
      </section>

      {/* ═══ BAND 7 · DARK · The math ═══════════════════════════════════════ */}
      <section className="bg-landing-ink px-6 py-20 sm:py-28">
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

      {/* ═══ BAND 8 · LIGHT · Pricing + done-with-you ═══════════════════════ */}
      <section id="pricing" className="scroll-mt-20 bg-white px-6 py-20 sm:py-28">
        <ScrollReveal className="mx-auto grid max-w-5xl grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1fr] lg:gap-16">
          <div className="text-center lg:text-left">
            <Eyebrow className="mb-3">Pricing</Eyebrow>
            <h2 className="font-cv-heading mb-3 text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
              One flat price. Everything included.
            </h2>
            <p className="mx-auto mb-6 max-w-md text-[14.5px] text-[#667085] lg:mx-0">
              Missed-call answering, answered-call capture, website intake, lead scoring, alerts, and weekly reports.
              No per-call or per-lead fees.
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
                note="ASSET PARTIALLY EXISTS — /team/nile.jpg is the founder headshot; this is a wider working shot for the same person."
                dims="1600×1000 · webp · 16:10"
                prompt={`A man in his thirties at a small home-office desk on a headset call, dual monitors showing a simple dashboard, notepad of handwritten call-flow notes beside the keyboard, warm desk lamp against a grey morning window, ${SHOOT}, 16:10`}
              />
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ═══ BAND 9 · LIGHT · FAQ (same light run as band 8) ════════════════ */}
      <section className="border-t border-[#eef1f4] bg-white px-6 py-20 sm:py-28">
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

      {/* ═══ BAND 10 · BLUE · Final CTA, full-bleed ═════════════════════════
          The only place on the page where the brand blue fills the entire
          viewport width. That is what makes the closer land, so do not wrap
          this in a rounded card. */}
      <section className="relative overflow-hidden bg-landing-primary px-6 py-20 text-white sm:py-28">
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
