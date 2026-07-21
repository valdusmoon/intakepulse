import type { Metadata } from "next";
import Link from "next/link";

import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { BookDemo } from "@/components/marketing/BookDemo";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { LandingNavShell } from "@/components/marketing/LandingNavShell";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { AudioSlot, MediaSlot, PhoneFrame } from "@/components/marketing/MediaSlot";
import { PricingCard } from "@/components/marketing/PricingCard";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { V3CallMeDemo } from "@/components/marketing/V3CallMeDemo";
import { V3LiveTranscript } from "@/components/marketing/V3LiveTranscript";

/**
 * /v3 — "PROOF FIRST" LAYOUT VARIANT (throwaway, noindex).
 *
 * Same approved copy as /v2, re-ordered around one finding: on every rival
 * voice-AI page, the move that converts is letting a skeptic VERIFY the thing
 * inside the first thirty seconds, before any argument is made. Nevermiss makes
 * "hear the real greeting" its biggest button and demotes signup to a ghost
 * link. Retell makes the visitor's own phone ring. Nobody shows a transcript
 * with the extraction happening live, which is the one thing Callverted
 * actually does that they don't.
 *
 * So /v2's argument order (leak → how → sources → proof) is inverted. The hero
 * sells nothing, it proves: a play button where /v2 had a trial CTA, and a
 * sample call sitting beside the headline. Then two demonstration sections back
 * to back (live transcript, then "let it call you"), and only after a visitor
 * has watched a call become a ranked lead does the page start arguing.
 *
 * Everything below the two demos is /v2's copy, unedited. The leak, the five
 * steps, the four sources, the packet, the comparison, the price, the FAQ.
 *
 * Treatment is light and editorial with exactly ONE dark band, the lead-packet
 * handoff, so the moment the product hands work to a human is the only place
 * the page goes black. Assets are audio and live UI rather than photography:
 * two AudioSlots and one image slot, everything else is real HTML.
 */

export const metadata: Metadata = {
  title: "Callverted | Hear What Happens When Nobody Picks Up",
  robots: { index: false, follow: false },
};

// ── Icon paths (stroke, 24-grid) ────────────────────────────────────────────
const I = {
  phone: "M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.4 0 .8-.3 1L6.6 10.8z",
  missed: "M18 6 6 18M6 6l12 12",
  recover: "M4 12a8 8 0 0 1 14-5.3L20 8M20 4v4h-4M20 12a8 8 0 0 1-14 5.3L4 16M4 20v-4h4",
  check: "M20 6 9 17l-5-5",
  arrow: "M5 12h14M13 6l6 6-6 6",
  dollar: "M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  globe: "M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zM3 12h18M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18z",
  link: "M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
  bolt: "M13 2 4.5 13.5H11l-1 8.5L19.5 10H13z",
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

// ── Section data (verbatim from /v2) ─────────────────────────────────────────
const LEAK_CARDS = [
  { icon: I.missed, t: "Missed calls", d: "You never even find out they called. They hang up and dial the next company on Google." },
  { icon: I.phone, t: "Answered, then forgotten", d: "Your tech takes the call between jobs. The name, the job, and the callback never get written down." },
  { icon: I.globe, t: "Web leads that sit", d: "A form fill waits in an inbox all afternoon. By the time someone replies, the job is booked elsewhere." },
];

const STEPS = [
  { icon: I.recover, t: "Capture", d: "Your phones ring first. If nobody picks up, Callverted answers live. Website and intake-link inquiries flow into the same system." },
  { icon: I.check, t: "Qualify", d: "It asks what a good dispatcher would ask: what happened, where, and how urgent. A few questions, not an interrogation." },
  { icon: I.dollar, t: "Quote from your rules", d: "Only prices you approved, repeated word for word. Anything else and it says your team will follow up. It never invents a number." },
  { icon: I.chat, t: "Reassure", d: "It repeats their problem back, names your business, and asks them to wait for your callback. That buys your team time to reach them first." },
  { icon: I.bell, t: "Rank and alert", d: "The lead is scored, then a notification hits your phone and inbox in about a minute: the job, the estimated value, and how fast to call back." },
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

const ASSURANCE = [
  "Their problem is repeated back, so they know it landed",
  "Your business name is what they remember, not ours",
  "It never promises a price or an arrival time on your behalf",
  "Every caller hears something, even at 2am",
  "Every channel ends the same way, phone or web",
];

const TRADES = [
  { name: "Restoration", href: "/industries/restoration", icon: I.recover },
  { name: "HVAC", href: "/industries/hvac", icon: I.bolt },
  { name: "Plumbing", href: "/industries/plumbing", icon: I.wrench },
  { name: "Electrical", href: "/industries/electrical", icon: I.bolt },
  { name: "General contracting", href: "/industries/general-contracting", icon: I.wrench },
  { name: "Your trade", href: "/industries", icon: I.arrow },
];

const TRUST = [
  "We build your call flow and lead sources with you",
  "You approve every service, price, and question before launch",
  "We run test calls together before a customer ever hears it",
  "A real person helps you tune it after launch",
];

const FAQ_V2 = [
  { q: "Is this just an AI receptionist?", a: "No. An answering service takes a message. Callverted qualifies the job, scores the lead, and tells your team who to call back first. It also captures answered calls and website inquiries, not just missed ones." },
  { q: "Does it replace my phone number?", a: "No. You publish a Callverted number that rings your team first on every call. Callverted only steps in when nobody picks up." },
  { q: "What happens when my team answers?", a: "If you switch on answered-call capture, the call is transcribed, summarized, and scored, so the details are saved instead of disappearing after hangup. The audio itself is deleted once transcribed, never stored." },
  { q: "Can it qualify website leads too?", a: "Yes. Add the website widget or share your intake link. Those submissions go through the same qualification and scoring as phone calls." },
  { q: "Will the AI make up prices?", a: "Never. Callers only hear pricing you approved, word for word. If there is no approved price, it says your team will follow up with a quote." },
  { q: "How fast can we launch?", a: "About 30 minutes of setup: call flow, service area, pricing rules, and test calls. We walk through it with you." },
];

export default function V3Page() {
  return (
    <div className="min-h-screen bg-white text-[#152033] overflow-x-hidden">
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <LandingNavShell>
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="v3logo" />
          <span className="font-cv-heading text-lg font-bold tracking-tight text-white">Callverted</span>
        </Link>
        <div className="flex items-center gap-6 text-sm">
          <a href="#hear" className="text-white/90 hover:text-white font-medium transition-colors hidden md:block">Hear it work</a>
          <a href="#how" className="text-white/90 hover:text-white font-medium transition-colors hidden lg:block">How it works</a>
          <a href="#pricing" className="text-white/90 hover:text-white font-medium transition-colors hidden sm:block">Pricing</a>
          <BookDemo className="font-medium text-white/90 hover:text-white transition-colors hidden md:block">Book a demo</BookDemo>
          <AuthAwareNavCta />
        </div>
      </LandingNavShell>

      {/* ── 1. Hero — the page proves before it sells ───────────────────── */}
      <section className="relative flex items-center overflow-hidden bg-landing-ink">
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(120% 90% at 15% 0%, #16223f 0%, #0a0f1c 55%)" }} />
        <div className="pointer-events-none absolute -top-24 right-[8%] h-[420px] w-[420px] rounded-full bg-landing-primary/25 blur-[120px]" aria-hidden />
        <div className="relative max-w-6xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-[1fr_0.95fr] gap-10 lg:gap-14 items-center pt-32 pb-20">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white mb-6">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-landing-primary-glow opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-landing-primary-glow" />
              </span>
              Real intake call · 0:22
            </span>
            <h1 className="font-cv-heading text-[44px] sm:text-[62px] font-bold leading-[0.98] tracking-[-0.035em] mb-6 text-white">
              Capture every lead. Call back the right ones first.
            </h1>
            <p className="text-lg text-white/70 mb-8 max-w-lg leading-relaxed">
              Callverted answers the calls your team misses, captures the ones they take, and qualifies every website
              inquiry. Each lead is scored and ranked, so your team knows which jobs need the fastest callback.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <a
                href="#hear"
                className="inline-flex items-center justify-center gap-2.5 font-semibold bg-landing-primary text-white pl-4 pr-6 py-3.5 rounded-xl hover:bg-blue-600 transition-colors shadow-[0_12px_34px_-8px_rgba(36,84,216,0.55)]"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/20">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                </span>
                Hear a real intake call
              </a>
              <Link
                href="/sign-up"
                className="text-center font-medium text-white/80 border border-white/20 px-7 py-3.5 rounded-xl hover:bg-white/10 hover:text-white transition-colors"
              >
                Start your free trial
              </Link>
            </div>
            <p className="text-[12.5px] text-white/50 font-medium">14-day free trial · your phones ring first · no per-lead fees</p>
          </div>

          <div id="hear" className="scroll-mt-28">
            <AudioSlot
              dark
              title="Sample intake call"
              note="7:12pm. Nobody picked up. This is what the customer heard instead of a voicemail beep."
              duration="0:22"
              prompt="Record a 22s intake call. Callverted: 'Thanks for calling Blue Star Restoration, the team is out on a job so I'll take the details. What's going on?' Caller (stressed woman, background noise): 'There's water coming into our basement, a pipe burst under the kitchen sink.' Callverted asks ZIP, then whether the main is shut off, then closes with the reassurance line. Warm, unhurried, never robotic."
            />
            <p className="mt-3 text-[12px] text-white/40 leading-relaxed">
              Real call, names changed. The transcript and the lead it produced are below.
            </p>
          </div>
        </div>
      </section>

      {/* ── 2. The centrepiece — watch a call become a ranked lead ───────── */}
      <section id="proof" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-10">
            <Eyebrow className="mb-3">Watch it work</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.03] mb-4">
              A call goes in. A ranked lead comes out.
            </h2>
            <p className="text-[16px] text-[#667085] leading-relaxed">
              This is the same call, written down. Watch the lead record on the right fill in as the caller talks, then
              the priority score assemble the moment they hang up. No form. No menu. Nothing typed by a human.
            </p>
          </ScrollReveal>

          <ScrollReveal delay={80}>
            <V3LiveTranscript />
          </ScrollReveal>

          {/* Caller assurance, folded in under the proof it belongs to */}
          <ScrollReveal delay={120} className="mt-10 rounded-2xl border border-[#e3e7ed] bg-white p-6 sm:p-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-6 lg:gap-10 items-start">
              <div>
                <Eyebrow className="mb-3">What your customer hears</Eyebrow>
                <h3 className="font-cv-heading text-2xl sm:text-[30px] font-bold tracking-[-0.03em] leading-[1.05] mb-3">
                  They hang up knowing you got it.
                </h3>
                <p className="text-[14.5px] text-[#667085] leading-relaxed">
                  No voicemail beep, no dead air. They have a reason to wait for your callback instead of calling
                  around, which is the window your team needs to win the job.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {ASSURANCE.map((a) => (
                  <div key={a} className="flex items-start gap-3">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                    </span>
                    <p className="text-[13.5px] text-[#344054] leading-snug">{a}</p>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 3. Second proof beat — let it call you ───────────────────────── */}
      <section id="callme" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal>
            <V3CallMeDemo />
          </ScrollReveal>
        </div>
      </section>

      {/* ── 4. The leak ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">The leak</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.03] mb-4">Every missed call is a customer dialing your competitor next.</h2>
            <p className="text-[16px] text-[#667085] leading-relaxed">A burst pipe at 7pm. Your crew is on a job, the phone rings out, and the homeowner calls the next number on Google. Answered calls leak too: the details live in someone&apos;s head until they don&apos;t.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LEAK_CARDS.map((c, i) => (
              <ScrollReveal key={c.t} delay={i * 90} className="rounded-2xl border border-[#e3e7ed] bg-white p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[#fff1f0] text-[#e5484d] mb-4"><Icon d={c.icon} /></span>
                <h3 className="font-cv-heading text-[16px] font-bold mb-1.5">{c.t}</h3>
                <p className="text-[13.5px] text-[#667085] leading-relaxed">{c.d}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. How it works ─────────────────────────────────────────────── */}
      <section id="how" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-white">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">How it works</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.03] mb-4">From first ring to ranked lead in about a minute.</h2>
            <p className="text-[16px] text-[#667085] leading-relaxed">You keep your phones. Publish one Callverted number and it rings your team first, every time. Answer it and the call still gets logged. Miss it and Callverted picks up live.</p>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {STEPS.map((s, i) => (
              <ScrollReveal key={s.t} delay={i * 90} className="rounded-2xl border border-[#e3e7ed] bg-[#f9fafb] p-5">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-landing-primary text-white font-cv-heading text-[15px] font-bold">{i + 1}</span>
                  <span className="text-landing-primary"><Icon d={s.icon} /></span>
                </div>
                <h3 className="font-cv-heading text-[16px] font-bold mb-1.5">{s.t}</h3>
                <p className="text-[13.5px] text-[#667085] leading-relaxed">{s.d}</p>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. Lead sources ─────────────────────────────────────────────── */}
      <section id="sources" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <div className="max-w-6xl mx-auto">
          <ScrollReveal className="max-w-2xl mb-12">
            <Eyebrow className="mb-3">Lead sources</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.03] mb-4">Four ways in. One list to work.</h2>
          </ScrollReveal>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {SOURCES.map((s, i) => (
              <ScrollReveal key={s.t} delay={i * 80} className="rounded-2xl border border-[#e3e7ed] bg-white p-6">
                <IconChip d={s.icon} />
                <h3 className="font-cv-heading text-[15px] font-bold mt-4 mb-1">{s.t}</h3>
                <p className="text-[13px] text-[#667085] leading-relaxed">{s.d}</p>
              </ScrollReveal>
            ))}
          </div>

          {/* Trade tuning, as a slim link row rather than its own section */}
          <ScrollReveal delay={120} className="mt-10 rounded-2xl border border-[#e3e7ed] bg-white p-6">
            <p className="text-[14px] text-[#667085] leading-relaxed mb-4 max-w-xl">
              Restoration, HVAC, plumbing, electrical, and contracting jobs come in differently. Your intake questions,
              pricing, and urgency rules match your trade.
            </p>
            <div className="flex flex-wrap gap-2">
              {TRADES.map((t) => (
                <Link
                  key={t.name}
                  href={t.href}
                  className="group inline-flex items-center gap-2 rounded-full border border-[#e3e7ed] bg-[#f9fafb] px-4 py-2 text-[13.5px] font-semibold text-[#344054] transition-colors hover:border-landing-primary/40 hover:bg-[#eef3ff] hover:text-landing-primary"
                >
                  <span className="text-landing-primary"><Icon d={t.icon} className="h-3.5 w-3.5" /></span>
                  {t.name}
                </Link>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 7. The handoff — THE ONE DARK BAND ──────────────────────────── */}
      <section id="product" className="scroll-mt-20 relative overflow-hidden px-6 py-20 sm:py-24 bg-landing-ink">
        <div className="pointer-events-none absolute inset-0" aria-hidden style={{ background: "radial-gradient(110% 80% at 80% 0%, #16223f 0%, #0a0f1c 60%)" }} />
        <div className="pointer-events-none absolute -bottom-32 left-[6%] h-[420px] w-[420px] rounded-full bg-landing-primary/20 blur-[130px]" aria-hidden />
        <div className="relative max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[0.85fr_1.15fr] gap-12 lg:gap-16 items-start">
          <ScrollReveal>
            <p className="text-xs font-bold uppercase tracking-widest text-landing-primary-glow mb-3">The handoff</p>
            <h2 className="font-cv-heading text-3xl sm:text-[40px] font-bold tracking-[-0.035em] leading-[1.03] mb-4 text-white">
              One list, ranked by who to call first.
            </h2>
            <p className="text-[15px] text-white/60 leading-relaxed mb-8">
              Missed calls, answered calls, and website inquiries all become the same lead record. It hits your phone
              and inbox the moment it lands, with everything your team needs to win the callback.
            </p>

            <PhoneFrame className="mx-auto max-w-[260px] lg:mx-0">
              <div className="px-3.5 pb-5 pt-7">
                {/* status bar */}
                <div className="flex items-center justify-between px-1.5 pb-6 text-[10px] font-semibold text-white/70">
                  <span className="font-cv-mono">7:13</span>
                  <span className="flex items-center gap-1" aria-hidden>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span className="h-1.5 w-1.5 rounded-full bg-white/50" />
                    <span className="h-1.5 w-3 rounded-sm bg-white/50" />
                  </span>
                </div>

                {/* the alert */}
                <div className="rounded-2xl bg-white/[0.13] p-3 backdrop-blur ring-1 ring-white/10">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="grid h-5 w-5 place-items-center rounded-md bg-white/90">
                      <CallvertedLogo className="h-3.5 w-3.5" gradientId="v3pushlogo" />
                    </span>
                    <span className="text-[10.5px] font-bold uppercase tracking-wide text-white/70">Callverted</span>
                    <span className="ml-auto text-[10px] text-white/40">now</span>
                  </div>
                  <p className="font-cv-heading text-[13.5px] font-bold leading-tight text-white">New lead · Hot · 92</p>
                  <p className="mt-1 text-[11.5px] leading-snug text-white/65">Water damage · Emergency · $1.8k–$3.2k</p>
                  <p className="mt-2.5 text-[10.5px] font-bold uppercase tracking-wide text-landing-primary-glow">Call within 10 minutes</p>
                </div>

                {/* a dimmer earlier one, so the stack reads as a real lock screen */}
                <div className="mt-2 rounded-2xl bg-white/[0.07] px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="h-4 w-4 rounded-md bg-white/25" aria-hidden />
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-white/35">Callverted</span>
                    <span className="ml-auto text-[9.5px] text-white/25">4:40pm</span>
                  </div>
                  <p className="mt-1.5 text-[11px] font-semibold text-white/40">New lead · Warm · 54</p>
                </div>
              </div>
            </PhoneFrame>
          </ScrollReveal>

          <ScrollReveal delay={90}>
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-4">What lands with it</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PACKET.map((p) => (
                <div key={p.t} className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <svg className="h-4 w-4 shrink-0 text-landing-primary-glow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" /></svg>
                    <h3 className="font-cv-heading text-[15px] font-bold text-white">{p.t}</h3>
                  </div>
                  <p className="text-[13px] text-white/55 leading-relaxed">{p.d}</p>
                </div>
              ))}
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ── 8. Category comparison ──────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-3xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Eyebrow className="mb-3">The category</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em]">Not an answering service. A system for winning the callback.</h2>
            <p className="mt-3 text-[15px] text-[#667085]">Answering the phone is only the start. Callverted qualifies the job, scores the lead, reassures the customer, and points your team at the callbacks worth winning.</p>
          </div>
          <div className="rounded-3xl border border-[#e3e7ed] bg-white overflow-hidden">
            <div className="grid grid-cols-[1.4fr_1.1fr_1.2fr] sm:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] bg-[#f9fafb] border-b border-[#e3e7ed] text-[11.5px] sm:text-[13px] font-bold">
              <div className="px-4 sm:px-6 py-4" />
              {COMPARE_COLS.map((c, i) => (
                <div key={c} className={`px-2 sm:px-3 py-4 text-center ${i < 2 ? "hidden sm:block" : ""} ${i === 3 ? "text-landing-primary bg-[#eef3ff] rounded-t-xl" : "text-[#667085]"}`}>{c}</div>
              ))}
            </div>
            {COMPARE_ROWS.map((row, i) => (
              <div key={row.dim} className={`grid grid-cols-[1.4fr_1.1fr_1.2fr] sm:grid-cols-[1.6fr_1fr_1fr_1fr_1.1fr] items-center text-[12.5px] sm:text-[13.5px] ${i > 0 ? "border-t border-[#eef1f4]" : ""}`}>
                <div className="px-4 sm:px-6 py-4 font-semibold text-[#152033]">{row.dim}</div>
                {row.vals.map((v, j) => (
                  <div key={j} className={`px-2 sm:px-3 py-4 text-center ${j < 2 ? "hidden sm:block" : ""} ${j === 3 ? "bg-[#f7faff] font-semibold text-[#152033]" : "text-[#667085]"}`}>
                    <Cell v={v} accent={j === 3} />
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className="sm:hidden mt-3 text-center text-[11.5px] text-[#98a2b3]">Shown vs. an AI receptionist. Voicemail &amp; text-back columns appear on a wider screen.</p>
        </ScrollReveal>
      </section>

      {/* ── 9. Pricing + done-with-you ──────────────────────────────────── */}
      <section id="pricing" className="scroll-mt-20 px-6 py-20 sm:py-24 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1fr] gap-12 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <Eyebrow className="mb-3">Pricing</Eyebrow>
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-[-0.035em] mb-3">One flat price. Everything included.</h2>
            <p className="text-[14.5px] text-[#667085] mb-6 max-w-md mx-auto lg:mx-0">Missed-call answering, answered-call capture, website intake, lead scoring, alerts, and weekly reports. No per-call or per-lead fees.</p>
            <PricingCard />
          </div>
          <div>
            <Eyebrow className="mb-3">Done with you</Eyebrow>
            <h3 className="font-cv-heading text-2xl sm:text-[28px] font-bold tracking-[-0.035em] leading-[1.1] mb-6">We help set it up, not just hand you software.</h3>
            <div className="space-y-4">
              {TRUST.map((t) => (
                <div key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-landing-primary/10 text-landing-primary">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  </span>
                  <p className="text-[15px] font-semibold text-[#344054] leading-snug">{t}</p>
                </div>
              ))}
            </div>
            <MediaSlot
              kind="image"
              className="aspect-[16/9] mt-7"
              title="Setup call, over the shoulder"
              note="The one photo on the page. Proves a human is on the other end of 'done with you'."
              dims="1200×675 · webp"
              prompt="Photograph, natural window light, shallow depth of field: a contractor in a work shirt at a cluttered office desk, laptop open on a video call with a support rep whose face is small and warm on screen. Phone and a printed price list beside the laptop. Documentary, unposed, not a stock-photo handshake. Muted blues and warm neutrals."
            />
          </div>
        </ScrollReveal>
      </section>

      {/* ── 10. FAQ ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white">
        <ScrollReveal className="max-w-2xl mx-auto">
          <div className="text-center mb-8"><Eyebrow className="mb-3">FAQ</Eyebrow><h2 className="font-cv-heading text-2xl sm:text-3xl font-bold tracking-[-0.035em]">Questions owners ask first</h2></div>
          <div className="rounded-2xl border border-[#e3e7ed] bg-white overflow-hidden">
            {FAQ_V2.map((faq, i) => (
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

      {/* ── 11. Final CTA — the player, a second time ───────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-t border-[#e3e7ed]">
        <div className="max-w-5xl mx-auto">
          <ScrollReveal className="max-w-xl mx-auto mb-10">
            <p className="text-center text-[14px] text-[#667085] leading-relaxed mb-4">
              One more, since it is the part that decides whether they wait for you. This is how every call ends.
            </p>
            <AudioSlot
              title="The closing reassurance"
              note="The last twelve seconds of any call. Their problem, repeated back, with your name on it."
              duration="0:12"
              prompt="Record 12s, same voice as the hero clip, slower and warmer: 'Sarah, we understand you're dealing with water coming into the basement, and that must be stressful. The team at Blue Star Restoration has been notified and will get back to you as soon as possible. Please wait for our callback.' No music, slight room tone, ends clean."
            />
          </ScrollReveal>

          <ScrollReveal delay={90}>
            <div className="relative overflow-hidden rounded-3xl px-8 sm:px-12 py-14 sm:py-16 text-center text-white shadow-[0_30px_60px_-24px_rgba(28,63,168,0.5)]" style={{ background: "linear-gradient(135deg, #2a5ae0 0%, #1c3fa8 55%, #16307e 100%)" }}>
              <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold tracking-[-0.035em] mb-4 leading-[1.05] max-w-2xl mx-auto">Stop letting good leads go cold.</h2>
              <p className="text-white/70 mb-8 text-[15px] max-w-xl mx-auto">Every source captured. Every serious lead scored. Your team calling the right people back while the job is still up for grabs.</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/sign-up" className="text-center font-semibold bg-white text-landing-primary px-6 py-3.5 rounded-xl hover:bg-[#f0f4ff] transition-colors shadow-lg whitespace-nowrap">Start your free trial</Link>
                <BookDemo className="text-center font-semibold text-white bg-white/10 border border-white/40 px-6 py-3.5 rounded-xl hover:bg-white/20 transition-colors whitespace-nowrap">Book a 15-min demo</BookDemo>
              </div>
              <p className="mt-5 text-[12.5px] text-white/60">14-day free trial · no contracts · real setup help</p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <MarketingFooter />
      <JsonLd data={faqSchema(FAQ_V2)} />

      {/* ── Corner CTA ───────────────────────────────────────────────────── */}
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

function Cell({ v, accent = false }: { v: boolean | string; accent?: boolean }) {
  if (v === true) return <svg className={`inline w-5 h-5 ${accent ? "text-landing-primary" : "text-[#23a35a]"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>;
  if (v === false) return <span className="inline-block w-4 h-0.5 rounded-full bg-[#d0d7e2]" />;
  return <span>{v}</span>;
}
