import Link from "next/link";
import { CallvertedLogo } from "@/components/CallvertedLogo";
import { HeroPhoneAnimation } from "@/components/marketing/HeroPhoneAnimation";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { MissedCallCalculator } from "@/components/marketing/MissedCallCalculator";
import { CallReplay } from "@/components/marketing/CallReplay";
// Retired: public "drive it yourself" sandbox — see the note in the demo
// section below. Kept for easy revival.
// import { InteractiveDemo } from "@/components/marketing/InteractiveDemo";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { FAQS } from "@/lib/marketing/faqs";

/** Self-serve demo booking (Calendly or similar). Set in env; the fallback keeps
 *  the CTA rendered in dev so the layout never silently loses it. */
const DEMO_URL = process.env.NEXT_PUBLIC_DEMO_BOOKING_URL ?? "https://calendly.com/callverted/demo";

const HERO_PROOF = [
  { num: "2:47 AM", label: "Call answered after your team misses it", color: "text-landing-alert" },
  { num: "90 sec", label: "Typical qualification, on the same call", color: "text-landing-primary-glow" },
  { num: "$1.8k–$3.2k", label: "Estimated job value, before you call back", color: "text-landing-green" },
];

// Outcome cards — what actually changes for the owner, not how the machinery
// works. The mechanism lives one section down.
const OUTCOMES = [
  {
    n: "01",
    title: "Nights, weekends, and mid-job — covered",
    body: "Most emergency calls come in while you're on a roof, under a house, or asleep. Every one gets a live answer and a promised callback — not a voicemail they'll never leave.",
  },
  {
    n: "02",
    title: "Leads arrive qualified and priced",
    body: "Every recovered call becomes a lead packet: what happened, how urgent it is, whether it's in your area, and an estimated value — with pricing read only from rules you approve.",
  },
  {
    n: "03",
    title: "You always know who to call first",
    body: "Leads are ranked by urgency, intent, and job value, so the $6,000 emergency never waits behind a tire-kicker.",
  },
];

// The service, in four steps. "We" voice on the recovery steps — Callverted is
// sold as a done-for-you service, not software the owner has to operate.
const STEPS = [
  {
    n: "1",
    title: "Your team gets the first ring",
    body: "Your Callverted number rings your real phones first. Answered calls stay exactly as they are today.",
  },
  {
    n: "2",
    title: "We answer the miss — live",
    body: "After about 20 seconds unanswered, Callverted picks up the same call. No voicemail. No “text us back” gamble.",
  },
  {
    n: "3",
    title: "We qualify and quote",
    body: "A short, trade-specific intake: what happened, how urgent, service-area fit. Price guidance comes only from rules you approve — never invented.",
  },
  {
    n: "4",
    title: "You call back and win it",
    body: "An instant alert with the scored lead: urgency, intent, estimated value, transcript, and the recommended next move.",
  },
];

// Draws the boundary against the crowded "AI receptionist" category: same
// mechanism (AI voice), completely different job.
const VS_RECEPTIONIST = [
  { them: "Answers every call", us: "Steps in when your team can't answer — or when you choose immediate coverage" },
  { them: "Tries to handle many tasks", us: "Focused on recovering and qualifying missed opportunities" },
  { them: "Books, answers FAQs, routes, chats", us: "Captures issue, urgency, fit, value, and callback need" },
  { them: "Optimizes for call handling", us: "Optimizes for recovered revenue" },
];

const INCLUDED = [
  "24/7 live answering on the calls your team misses",
  "Trade-specific qualification on every recovered call",
  "Price guidance from rules you approve — never invented",
  "Urgency, intent, and estimated value on every lead",
  "Instant lead alerts with summaries and full transcripts",
  "Website widget and shareable intake link",
  "Weekly performance recap",
];

/** Consistent section header — one type scale and rhythm across the page. */
function SectionHeader({
  eyebrow,
  title,
  sub,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  sub?: string;
  dark?: boolean;
}) {
  return (
    <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-14">
      <p className={`text-xs font-bold uppercase tracking-widest mb-3 ${dark ? "text-landing-primary-glow" : "text-landing-primary"}`}>
        {eyebrow}
      </p>
      <h2 className={`font-cv-heading text-3xl sm:text-4xl font-bold tracking-tight leading-tight ${dark ? "text-white" : "text-[#152033]"}`}>
        {title}
      </h2>
      {sub && (
        <p className={`mt-4 text-[15px] leading-relaxed ${dark ? "text-white/55" : "text-[#667085]"}`}>{sub}</p>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-landing-paper text-[#152033]">

      {/* ── Hero (dark) ────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(180deg,#12224e 0%,#0b1226 48%,#0a0f1c 100%)" }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[560px]"
          style={{ background: "radial-gradient(ellipse 65% 90% at 50% -12%, rgba(91,140,255,0.22), transparent 72%)" }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 0%, black 34%, transparent 95%)",
          }}
          aria-hidden
        />

        <nav className="relative z-10 border-b border-white/10 px-6 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5">
              <CallvertedLogo className="h-8 w-8 shadow-[0_2px_10px_rgba(0,0,0,0.35)]" gradientId="cvLogoNav" />
              <span className="font-cv-heading text-lg font-bold tracking-tight">Callverted</span>
            </Link>
            <div className="flex items-center gap-5">
              <Link href="#how" className="text-sm text-white/60 hover:text-white transition-colors hidden md:block">How it works</Link>
              <Link href="#demo" className="text-sm text-white/60 hover:text-white transition-colors hidden md:block">See it work</Link>
              <Link href="/industries" className="text-sm text-white/60 hover:text-white transition-colors hidden lg:block">Industries</Link>
              <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">Pricing</Link>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-white/85 border border-white/25 px-4 py-2 rounded-lg hover:bg-white/10 transition-colors hidden sm:block"
              >
                Book a demo
              </a>
              <AuthAwareNavCta />
            </div>
          </div>
        </nav>

        <section className="relative z-10 px-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 lg:grid-rows-[auto_auto] gap-x-14 gap-y-8 items-center">

            <div className="order-1 lg:col-start-1 lg:row-start-1 lg:self-end">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-semibold text-landing-primary-glow mb-7">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-landing-primary-glow opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-landing-primary-glow" />
                </span>
                Lead recovery service for home-service trades
              </div>
              <h1 className="font-cv-heading text-4xl sm:text-6xl font-bold leading-[1.02] tracking-tight mb-6">
                Stop losing emergency jobs to voicemail.
              </h1>
              <p className="text-lg text-white/60 mb-9 max-w-md leading-relaxed">
                When your team can&apos;t pick up, Callverted answers the same call live — qualifies the job, quotes
                from pricing you approve, and hands you a ranked, callback-ready lead while the customer is still
                yours.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-7">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto text-center font-semibold bg-landing-primary text-white px-7 py-3.5 rounded-xl hover:bg-blue-600 transition-colors text-base shadow-[0_10px_40px_-8px_rgba(36,84,216,0.65)]"
                >
                  Start 14-day free trial
                </Link>
                <a
                  href={DEMO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto text-center font-medium text-white/80 px-7 py-3.5 rounded-xl border border-white/20 hover:bg-white/5 transition-colors text-base"
                >
                  Book a 15-min demo
                </a>
              </div>
              <p className="text-xs text-white/40 font-cv-mono">
                No contracts · Set up in ~30 minutes · Then it runs on its own
              </p>
            </div>

            {/* Phone — right after the copy on mobile; right column on desktop */}
            <div className="order-2 lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:self-center">
              <HeroPhoneAnimation />
            </div>

            {/* Proof stats — below the phone on mobile; under the copy on desktop */}
            <div className="order-3 lg:col-start-1 lg:row-start-2 lg:self-start">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg">
                {HERO_PROOF.map((p) => (
                  <div
                    key={p.label}
                    className="rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.09] to-white/[0.02] px-3.5 py-3"
                  >
                    <div className={`font-cv-mono text-[15px] font-bold ${p.color}`}>{p.num}</div>
                    <div className="text-white/55 text-[11.5px] leading-snug mt-1">{p.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="relative z-10 border-t border-white/10 px-6 py-6">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-2 sm:gap-x-10 text-sm font-medium">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/35">Built for</span>
            <span className="text-white/70">Restoration</span>
            <span className="text-white/15">·</span>
            <span className="text-white/70">Emergency plumbing</span>
            <span className="text-white/15">·</span>
            <span className="text-white/70">HVAC</span>
            <span className="text-white/15 hidden sm:block">·</span>
            <span className="text-white/70">Electrical</span>
          </div>
        </div>
      </div>

      {/* ── Outcomes (light) — what changes for the owner ─────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white border-b border-[#e3e7ed]">
        <ScrollReveal className="max-w-5xl mx-auto">
          <SectionHeader
            eyebrow="Why owners keep it on"
            title="You'll still miss calls. You'll stop losing the jobs."
            sub="Callverted doesn't change how your team works. It changes what a missed call costs you."
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {OUTCOMES.map((o) => (
              <div key={o.n} className="rounded-2xl border border-[#e3e7ed] bg-white p-7 shadow-sm">
                <div className="font-cv-mono text-[11px] font-bold text-landing-primary mb-4">{o.n}</div>
                <h3 className="font-cv-heading text-lg font-bold text-[#152033] leading-snug mb-2.5">{o.title}</h3>
                <p className="text-sm text-[#667085] leading-relaxed">{o.body}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── How the service works (light gray) ────────────────────────────── */}
      <section id="how" className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-b border-[#e3e7ed]">
        <ScrollReveal className="max-w-6xl mx-auto">
          <SectionHeader
            eyebrow="How it works"
            title="Set it up once. It runs in the background."
            sub="About 30 minutes to go live: forward your line, confirm your services and pricing, make a test call. After that, most owners just check the morning lead list."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STEPS.map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-[#e3e7ed] bg-white p-6 shadow-sm">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-landing-primary/[0.08] font-cv-mono text-[13px] font-bold text-landing-primary mb-4">
                  {s.n}
                </div>
                <h3 className="font-cv-heading text-[15.5px] font-bold text-[#152033] leading-snug mb-2">{s.title}</h3>
                <p className="text-[13.5px] text-[#667085] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Live call demo (dark) ─────────────────────────────────────────── */}
      <section id="demo" className="relative overflow-hidden px-6 py-20 sm:py-24 bg-landing-ink text-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.2]"
          style={{ background: "radial-gradient(ellipse 65% 100% at 50% 0%, rgba(91,140,255,.45), transparent 75%)" }}
          aria-hidden
        />
        <ScrollReveal className="relative max-w-3xl mx-auto">
          <SectionHeader
            dark
            eyebrow="See it work"
            title="Forty seconds for the caller. A ranked lead for you."
            sub="The exact flow that runs on your line, played out on a real water-damage call. Your caller gets a calm, live answer — you get the scored packet."
          />
          <CallReplay />
          <p className="mt-6 text-center text-sm text-white/50">
            Want to see it run on your own trade?{" "}
            <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-landing-primary-glow hover:text-white transition-colors">
              Book a 15-minute demo →
            </a>
          </p>

          {/* RETIRED — public "drive it yourself" sandbox. It called the real
              engine over /api/demo, an unauthenticated, cost-bearing LLM
              endpoint with only a best-effort in-memory rate limit (no real bot
              gate or global spend cap). The scripted CallReplay above now shows
              the live-extraction moment for free with zero abuse surface, and
              the real interactive test lives in-app at /dashboard/test-call
              (behind auth). Kept here (and the InteractiveDemo component +
              /api/demo route) for easy revival. To restore: uncomment below,
              re-import InteractiveDemo, and re-add '/api/demo(.*)' to the
              middleware public-route list (see src/middleware.ts) — the route
              is currently gated (404s for anonymous) precisely to keep it
              closed. Harden with a bot gate + global cap before reopening.
          <details className="group mt-4">
            <summary className="flex cursor-pointer list-none items-center justify-center gap-1.5 text-[13px] font-semibold text-white/55 hover:text-white transition-colors">
              <span>Rather drive it yourself? Try the live sandbox</span>
              <span className="transition-transform group-open:rotate-90" aria-hidden>›</span>
            </summary>
            <div className="mt-4">
              <InteractiveDemo />
            </div>
          </details>
          */}
        </ScrollReveal>
      </section>

      {/* ── What you receive (light) ──────────────────────────────────────── */}
      <section id="product" className="px-6 py-20 sm:py-24 bg-white border-b border-[#e3e7ed]">
        <ScrollReveal className="max-w-3xl mx-auto">
          <SectionHeader
            eyebrow="What you receive"
            title="A lead packet, not a voicemail light."
            sub="Every recovered call lands in one place — scored, summarized, and sorted by who to call first. A minute in the morning is usually all it takes."
          />
          <ProductShowcase />
        </ScrollReveal>
      </section>

      {/* ── Missed-call calculator (dark) ─────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-24 bg-landing-ink text-white border-t border-white/5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.22]"
          style={{ background: "radial-gradient(ellipse 65% 100% at 50% 0%, rgba(91,140,255,.5), transparent 75%)" }}
          aria-hidden
        />
        <ScrollReveal className="relative max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
          <div>
            <p className="text-xs font-bold text-landing-primary-glow uppercase tracking-widest mb-3">The math</p>
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">
              What are missed calls costing you right now?
            </h2>
            <p className="text-white/55 text-[15px] leading-relaxed">
              Drag the sliders to your own call volume and job size. It&apos;s meant to make the cost of silence
              concrete — not to promise every missed call becomes a job.
            </p>
          </div>
          <div className="border border-white/10 bg-white/[0.045] rounded-[24px] p-6 sm:p-7">
            <MissedCallCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── Not a receptionist — the category boundary ────────────────────── */}
      <section className="px-6 py-20 sm:py-24 bg-white border-b border-[#e3e7ed]">
        <ScrollReveal className="max-w-3xl mx-auto">
          <SectionHeader
            eyebrow="The difference"
            title="Not a receptionist. A recovery service."
            sub="Generic AI receptionists try to answer everything. Callverted does one job: recover the calls your team couldn't answer, qualify them, and tell you who to call first."
          />
          <div className="overflow-hidden rounded-2xl border border-[#e3e7ed] shadow-sm">
            <div className="grid grid-cols-2 text-sm border-b border-[#e3e7ed]">
              <div className="bg-[#f9fafb] px-4 sm:px-5 py-3.5 font-cv-heading font-bold text-[#98a2b3]">
                Generic AI receptionist
              </div>
              <div className="bg-landing-primary/[0.06] px-4 sm:px-5 py-3.5 font-cv-heading font-bold text-[#152033] border-l border-[#e3e7ed]">
                Callverted
              </div>
            </div>
            {VS_RECEPTIONIST.map((row) => (
              <div key={row.us} className="grid grid-cols-2 text-sm border-b border-[#eef1f4] last:border-0">
                <div className="px-4 sm:px-5 py-4 text-[#98a2b3] leading-snug">{row.them}</div>
                <div className="px-4 sm:px-5 py-4 text-[#475467] font-medium leading-snug bg-landing-primary/[0.03] border-l border-[#e3e7ed]">
                  {row.us}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-[#667085] mt-6 max-w-xl mx-auto">
            Unlike voicemail or missed-call text-back, Callverted answers the original call live &mdash; and hands you
            a lead packet, not just a phone number.
          </p>
        </ScrollReveal>
      </section>

      {/* ── Pricing (light gray) ──────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-20 sm:py-24 bg-[#f9fafb] border-b border-[#e3e7ed]">
        <ScrollReveal className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold tracking-tight text-[#152033] mb-4 leading-tight">
              One flat rate. The whole service.
            </h2>
            <p className="text-[#667085] text-[15px] leading-relaxed">
              No per-lead fees, no per-minute surprises, no contracts. If one recovered job a month doesn&apos;t cover
              it several times over, Callverted isn&apos;t for you — and the 14-day trial will tell you either way.
            </p>
          </div>

          <div className="relative">
            <div
              className="pointer-events-none absolute -inset-8 rounded-[36px] opacity-[0.14] blur-3xl"
              style={{ background: "radial-gradient(circle at 50% 25%, var(--color-landing-primary), transparent 70%)" }}
              aria-hidden
            />
            <div className="relative rounded-[26px] border border-[#e3e7ed] bg-white p-8 shadow-lg">
              <div className="flex justify-between items-start gap-4 mb-6">
                <div>
                  <p className="font-extrabold text-[18px] text-[#152033]">Convert</p>
                  <p className="text-[#667085] text-[13px] mt-1">For home-service businesses that miss calls after hours or during jobs.</p>
                </div>
                <span className="inline-flex items-center rounded-full border border-[#cfdbff] bg-[#eaf0ff] text-[#173a8f] px-2.5 py-1 text-[11px] font-bold whitespace-nowrap">
                  Founding rate
                </span>
              </div>
              <p className="font-cv-heading text-5xl font-black text-[#152033] tracking-tight">
                $149<span className="text-base font-semibold text-[#98a2b3] ml-1">/mo</span>
              </p>
              <p className="text-[12.5px] text-[#667085] mt-1.5">Locked in for founding customers, while the product is focused.</p>
              <ul className="mt-6 space-y-2.5">
                {INCLUDED.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[#475467]">
                    <svg className="w-4 h-4 shrink-0 mt-0.5 text-landing-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/sign-up"
                className="mt-7 block text-center font-semibold bg-landing-primary text-white py-3 rounded-xl hover:bg-blue-600 transition-colors text-sm"
              >
                Start 14-day free trial
              </Link>
              <p className="text-center text-xs text-[#98a2b3] mt-3">
                Cancel anytime · or{" "}
                <a href={DEMO_URL} target="_blank" rel="noopener noreferrer" className="font-semibold text-landing-primary hover:underline">
                  book a 15-min demo
                </a>{" "}
                first
              </p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FAQ (light, accordion — native <details>, no JS needed) ───────── */}
      <section className="px-6 py-20 sm:py-24">
        <JsonLd data={faqSchema(FAQS)} />
        <ScrollReveal className="max-w-2xl mx-auto">
          <SectionHeader eyebrow="FAQ" title="Questions owners ask first" />
          <div className="rounded-2xl border border-[#e3e7ed] bg-white overflow-hidden">
            {FAQS.map((faq, i) => (
              <details key={faq.q} className={`group ${i > 0 ? "border-t border-[#e3e7ed]" : ""} [&_summary::-webkit-details-marker]:hidden`}>
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-bold text-[#152033] px-5 py-4.5">
                  {faq.q}
                  <svg
                    className="w-4 h-4 shrink-0 text-[#98a2b3] transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </summary>
                <p className="px-5 pb-4.5 text-sm text-[#667085] leading-relaxed">{faq.a}</p>
              </details>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Footer CTA + footer (dark, bookends the page) ─────────────────── */}
      <div className="relative overflow-hidden bg-landing-ink text-white">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage: "radial-gradient(rgba(255,255,255,0.09) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
            maskImage: "radial-gradient(ellipse 70% 70% at 50% 20%, black 30%, transparent 90%)",
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72"
          style={{ background: "radial-gradient(ellipse 60% 90% at 50% -10%, rgba(91,140,255,0.18), transparent 72%)" }}
          aria-hidden
        />
        <section className="relative z-10 px-6 py-20 sm:py-24">
          <ScrollReveal className="max-w-xl mx-auto text-center">
            <h2 className="font-cv-heading text-3xl sm:text-4xl font-bold tracking-tight mb-4 leading-tight">
              The next missed call doesn&apos;t have to be a lost job.
            </h2>
            <p className="text-white/55 mb-8 text-[15px] leading-relaxed">
              Put Callverted behind your number this week. Your team keeps the first ring — we catch, qualify, and
              rank everything they can&apos;t.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/sign-up"
                className="w-full sm:w-auto font-semibold bg-landing-primary text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-colors"
              >
                Start 14-day free trial
              </Link>
              <a
                href={DEMO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto font-medium text-white/80 px-8 py-3.5 rounded-xl border border-white/20 hover:bg-white/5 transition-colors"
              >
                Book a 15-min demo
              </a>
            </div>
          </ScrollReveal>
        </section>
      </div>

      <MarketingFooter />

    </div>
  );
}
