import Link from "next/link";
import { CallvertedLogo } from "@/components/CallvertedLogo";
import { HeroPhoneAnimation } from "@/components/marketing/HeroPhoneAnimation";
import { ProductShowcase } from "@/components/marketing/ProductShowcase";
import { MissedCallCalculator } from "@/components/marketing/MissedCallCalculator";
import { CallReplay } from "@/components/marketing/CallReplay";
// Retired: public "drive it yourself" sandbox — see the commented <details> in
// the demo section below. Kept for easy revival.
// import { InteractiveDemo } from "@/components/marketing/InteractiveDemo";
import { ScrollReveal } from "@/components/marketing/ScrollReveal";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { MarketingFooter } from "@/components/marketing/MarketingChrome";
import { JsonLd, faqSchema } from "@/components/marketing/JsonLd";
import { FAQS } from "@/lib/marketing/faqs";

const HERO_PROOF = [
  { num: "2:47 AM", label: "Call answered after your team misses it" },
  { num: "90 sec", label: "Typical structured intake window" },
  { num: "$1.8k–$3.2k", label: "Estimated value shown before callback" },
];

const STATS = [
  { stat: "100×", label: "more likely to make contact responding in 5 min vs. 30" },
  { stat: "78%", label: "of customers buy from the first business to respond" },
  { stat: "47 hrs", label: "average industry response time to a new lead" },
];

const FLOW = [
  {
    k: "Missed",
    title: "Your team rings first",
    body: "The customer calls your Callverted number and your real phone rings. Answered calls stay completely normal. Callverted only steps in on the ones that would hit voicemail.",
  },
  {
    k: "Answered",
    title: "Callverted picks up live",
    body: "After ~20 seconds with no answer, it answers the same call itself: no voicemail, no missed-call text for a panicked homeowner to ignore.",
  },
  {
    k: "Qualified",
    title: "It runs the intake",
    body: "The questions that actually decide the job: what's going on, how urgent it is, what type of service is needed, and whether it's in your service area.",
  },
  {
    k: "Guided",
    title: "It shares guidance you approved",
    body: "If you've approved value guidance for that job type, the caller hears a realistic ballpark. If you haven't, it simply says your team will confirm pricing. It never invents a number or commits you to a formal quote.",
  },
  {
    k: "Reassured",
    title: "It sets the callback, then alerts you",
    body: "The caller is told a specialist will call back fast, so they don't dial your competitor next. You get a scored lead packet with urgency, intent, value, summary, transcript, and next action.",
  },
];

const COMPARISON = [
  { label: "Voicemail", sub: "Asks the homeowner to do the work. No urgency, no scoring, no service context, no next action.", strong: false },
  { label: "Missed-call text", sub: "Useful for simple follow-up, but it still depends on a panicked caller seeing and replying to a text.", strong: false },
  { label: "Callverted", sub: "Answers live, reassures the caller, runs the intake, and delivers a lead packet you can act on immediately.", strong: true },
];


export default function HomePage() {
  return (
    <div className="min-h-screen bg-landing-paper text-[#152033]">

      {/* ── Hero (dark) — interactive: click a step to seek the animation ─── */}
      <div
        className="relative overflow-hidden text-white"
        style={{ background: "linear-gradient(180deg,#12224e 0%,#0b1226 48%,#0a0f1c 100%)" }}
      >
        {/* Blue light spilling from the top — adds warmth and pop without a floating orb */}
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
              <Link href="#demo" className="text-sm text-white/60 hover:text-white transition-colors hidden md:block">Demo</Link>
              <Link href="/industries" className="text-sm text-white/60 hover:text-white transition-colors hidden md:block">Industries</Link>
              <Link href="#pricing" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">Pricing</Link>
              <AuthAwareNavCta />
            </div>
          </div>
        </nav>

        <section className="relative z-10 px-6 pt-16 pb-20 sm:pt-20 sm:pb-24">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-14 items-center">

            <div className="order-1 lg:order-1">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/15 rounded-full px-3.5 py-1.5 text-xs font-semibold text-landing-primary-glow mb-7">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full rounded-full bg-landing-primary-glow opacity-75 animate-ping" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-landing-primary-glow" />
                </span>
                AI voice overflow for urgent home-service calls
              </div>
              <h1 className="font-cv-heading text-4xl sm:text-6xl font-bold leading-[1.0] tracking-tight mb-6">
                The emergency call you missed just became a qualified lead.
              </h1>
              <p className="text-lg text-white/60 mb-9 max-w-md leading-relaxed">
                Callverted picks up when your team can&apos;t, asks the intake questions that matter, estimates
                job value, and sends a callback-ready lead while the caller is still hot.
              </p>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-7">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto text-center font-semibold bg-landing-primary text-white px-7 py-3.5 rounded-xl hover:bg-blue-600 transition-colors text-base shadow-[0_10px_40px_-8px_rgba(36,84,216,0.65)]"
                >
                  Start 14-day trial
                </Link>
                <Link
                  href="#product"
                  className="w-full sm:w-auto text-center font-medium text-white/80 px-7 py-3.5 rounded-xl border border-white/20 hover:bg-white/5 transition-colors text-base"
                >
                  See the lead packet
                </Link>
              </div>
              <p className="text-xs text-white/40 font-cv-mono mb-9">
                14-day free trial · Live today · Setup in ~30 min
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 max-w-lg">
                {HERO_PROOF.map((p) => (
                  <div
                    key={p.label}
                    className="rounded-2xl border border-white/12 bg-gradient-to-b from-white/[0.09] to-white/[0.02] px-3.5 py-3"
                  >
                    <div className="font-cv-mono text-[15px] font-bold text-landing-primary-glow">{p.num}</div>
                    <div className="text-white/55 text-[11.5px] leading-snug mt-1">{p.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="order-2 lg:order-2">
              <HeroPhoneAnimation />
            </div>
          </div>
        </section>

        <div className="relative z-10 border-t border-white/10 px-6 py-6">
          <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-medium text-white/40">
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

      {/* ── Stats (light) ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-14 sm:py-16">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.06]"
          style={{ background: "radial-gradient(ellipse 55% 100% at 50% 0%, var(--color-landing-primary), transparent 70%)" }}
          aria-hidden
        />
        <ScrollReveal className="relative max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STATS.map((s) => (
              <div key={s.stat} className="flex items-center gap-3 bg-white rounded-xl px-4 py-3.5 border border-[#e3e7ed]">
                <p className="font-cv-mono text-2xl font-bold text-landing-primary shrink-0">{s.stat}</p>
                <p className="text-[12.5px] text-[#344054] leading-snug">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-[11px] text-[#98a2b3] mt-5">
            Source: MIT / Lead Response Management Study · Drift/InsideSales.com
          </p>
        </ScrollReveal>
      </section>

      {/* ── How it works (light) — the recovery flow as a connected timeline ─ */}
      <section id="how" className="relative overflow-hidden px-6 py-16 sm:py-20 bg-white border-y border-[#e3e7ed]">
        <div
          className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full opacity-[0.05] blur-3xl bg-landing-primary"
          aria-hidden
        />
        <ScrollReveal className="relative max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">The recovery flow</p>
            <h2 className="font-cv-heading text-3xl sm:text-[40px] font-bold text-[#152033] mb-3 leading-tight">
              One missed call, recovered in five steps.
            </h2>
            <p className="text-[#667085] max-w-xl mx-auto">
              Every step happens on the original call, while the homeowner is still on the line: urgent, emotional, and
              expensive to miss.
            </p>
          </div>

          <div className="max-w-2xl mx-auto">
            <div className="relative">
              {/* Vertical rail connecting the beats — fades out at the payoff */}
              <div
                className="absolute left-[5px] top-2 bottom-2 w-px bg-gradient-to-b from-landing-primary/45 via-landing-primary/20 to-transparent"
                aria-hidden
              />
              <div className="space-y-8">
                {FLOW.map((s) => (
                  <div key={s.k} className="relative flex gap-5">
                    <div className="relative z-10 shrink-0 mt-[7px] w-[11px] h-[11px] rounded-full bg-landing-primary ring-4 ring-white" />
                    <div>
                      <p className="font-cv-mono text-[11px] font-bold text-landing-primary uppercase tracking-wider mb-1">{s.k}</p>
                      <h3 className="font-cv-heading text-lg font-bold text-[#152033] mb-1.5">{s.title}</h3>
                      <p className="text-sm text-[#667085] leading-relaxed">{s.body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── Interactive demo (dark) — let them feel the intake, then see the packet ── */}
      <section id="demo" className="relative overflow-hidden px-6 py-16 sm:py-20 bg-landing-ink text-white">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.2]"
          style={{ background: "radial-gradient(ellipse 65% 100% at 50% 0%, rgba(91,140,255,.45), transparent 75%)" }}
          aria-hidden
        />
        <ScrollReveal className="relative max-w-3xl mx-auto">
          <div className="text-center mb-9">
            <p className="text-xs font-bold text-landing-primary-glow uppercase tracking-widest mb-2">See it work</p>
            <h2 className="font-cv-heading text-3xl sm:text-[40px] font-bold mb-3 leading-tight">
              Watch one call become a scored lead.
            </h2>
            <p className="text-white/55 leading-relaxed">
              A calm, forty-second call for your caller. A scored lead packet for you the second they hang up. Same
              engine that answers your overflow, playing out below.
            </p>
          </div>
          <CallReplay />

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

      {/* ── Product showcase (light) — visual proof, not feature bullets ──── */}
      {/* The lead packet is the differentiated output, so it precedes the ROI
          calculator: show what they actually receive before quantifying it. */}
      <section id="product" className="relative overflow-hidden px-6 py-16 sm:py-20 bg-white border-y border-[#e3e7ed]">
        <div
          className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full opacity-[0.05] blur-3xl bg-landing-primary"
          aria-hidden
        />
        <ScrollReveal className="relative max-w-3xl mx-auto">
          <div className="text-center mb-9">
            <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">Product proof</p>
            <h2 className="font-cv-heading text-3xl font-bold text-[#152033] mb-2">Show the product, not another AI promise</h2>
            <p className="text-[#667085] text-sm">
              The lead packet is the sell: what happened, why it matters, what it may be worth, and what to do next.
            </p>
          </div>
          <ProductShowcase />
        </ScrollReveal>
      </section>

      {/* ── Missed-call calculator (dark) ────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-16 sm:py-20 bg-landing-ink text-white border-t border-white/5">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-64 opacity-[0.22]"
          style={{ background: "radial-gradient(ellipse 65% 100% at 50% 0%, rgba(91,140,255,.5), transparent 75%)" }}
          aria-hidden
        />
        <ScrollReveal className="relative max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-10 items-center">
          <div>
            <p className="text-xs font-bold text-landing-primary-glow uppercase tracking-widest mb-2">Missed-call math</p>
            <h2 className="font-cv-heading text-3xl sm:text-[40px] font-bold mb-3 leading-tight">
              How much emergency revenue is sitting in missed calls?
            </h2>
            <p className="text-white/55 leading-relaxed">
              Drag the slider to your own call volume. It&apos;s meant to make the cost of silence concrete, not to
              promise every missed call becomes a job.
            </p>
          </div>
          <div className="border border-white/10 bg-white/[0.045] rounded-[24px] p-6 sm:p-7">
            <MissedCallCalculator />
          </div>
        </ScrollReveal>
      </section>

      {/* ── Comparison (light) ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-16 sm:py-20">
        <div
          className="pointer-events-none absolute -bottom-24 left-1/2 -translate-x-1/2 h-72 w-[32rem] opacity-[0.05] blur-3xl"
          style={{ background: "radial-gradient(ellipse, var(--color-landing-primary), transparent 70%)" }}
          aria-hidden
        />
        <ScrollReveal className="relative max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">Why it converts</p>
            <h2 className="font-cv-heading text-2xl sm:text-3xl font-bold text-[#152033] mb-3">
              Not a text-back. Not a voicemail. Not a generic bot.
            </h2>
            <p className="text-sm text-[#667085]">Emergency callers are often anxious about cost and timing. The first real answer has an advantage.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {COMPARISON.map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl p-6 border ${item.strong ? "bg-white border-landing-primary/30 shadow-md" : "bg-[#f9fafb] border-[#e3e7ed] opacity-75"}`}
              >
                <p className={`font-cv-heading text-xl font-bold mb-2 ${item.strong ? "text-[#152033]" : "text-[#475467]"}`}>{item.label}</p>
                <p className={`text-sm leading-relaxed ${item.strong ? "text-[#475467]" : "text-[#98a2b3]"}`}>{item.sub}</p>
              </div>
            ))}
          </div>
        </ScrollReveal>
      </section>

      {/* ── Pricing (light) ──────────────────────────────────────────────── */}
      <section id="pricing" className="px-6 py-16 sm:py-20 bg-[#f9fafb] border-y border-[#e3e7ed]">
        <ScrollReveal className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-10 items-center">
          <div>
            <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">Founding pricing</p>
            <h2 className="font-cv-heading text-3xl sm:text-[42px] font-bold text-[#152033] mb-3 leading-tight">
              Simple enough to say yes. Valuable enough to keep.
            </h2>
            <p className="text-[#667085] leading-relaxed">
              Start with one plan while the product is focused. Higher tiers can come later once usage, minutes, and
              customer value are proven.
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
                <p className="text-[#667085] text-[13px] mt-1">For home service businesses that miss calls after hours or during jobs.</p>
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
              {[
                "AI voice overflow when your team misses a call",
                "Intake flows tuned to your service categories",
                "Urgency, intent, and estimated value on every qualified lead",
                "Business-approved price/value guidance by service category",
                "Lead dashboard, call log, summaries, and transcripts",
                "Public intake link and website embed",
                "Email alerts and weekly performance recap",
              ].map((f) => (
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
              Start free trial
            </Link>
            <p className="text-center text-xs text-[#98a2b3] mt-3">14-day free trial. Cancel anytime.</p>
            </div>
          </div>
        </ScrollReveal>
      </section>

      {/* ── FAQ (light, accordion — native <details>, no JS needed) ───────── */}
      <section className="px-6 py-16 sm:py-20">
        <JsonLd data={faqSchema(FAQS)} />
        <ScrollReveal className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="font-cv-heading text-2xl font-bold text-[#152033]">Questions owners ask first</h2>
          </div>
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
        <section className="relative z-10 px-6 py-20">
          <ScrollReveal className="max-w-xl mx-auto text-center">
            <h2 className="font-cv-heading text-2xl sm:text-3xl font-bold mb-3 leading-tight">
              Stop letting emergency calls become someone else&apos;s job.
            </h2>
            <p className="text-white/55 mb-7 text-sm leading-relaxed">
              Give your team the first ring. Let Callverted catch the calls they can&apos;t answer, qualify the
              emergency, and push the right leads to the top.
            </p>
            <Link
              href="/sign-up"
              className="inline-block font-semibold bg-landing-primary text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-colors"
            >
              Start 14-day trial
            </Link>
          </ScrollReveal>
        </section>

      </div>

      <MarketingFooter />

    </div>
  );
}
