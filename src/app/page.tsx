import Link from "next/link";

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Prospect calls, no one answers",
    body: "Your IntakePulse number rings your real phone. If the call goes unanswered, we catch it — in seconds, not hours.",
  },
  {
    step: "02",
    title: "They get a text within seconds",
    body: "An automated SMS goes out with a link to a short intake form. The average B2B response time is 47 hours. Yours is under 30 seconds.",
  },
  {
    step: "03",
    title: "They fill out the form on their phone",
    body: "8 quick questions: damage type, rooms affected, insurance status, severity. Mobile-first, takes under 2 minutes.",
  },
  {
    step: "04",
    title: "You get a scored lead packet",
    body: "Email lands in your inbox with urgency score, estimated job value, AI summary, and a one-tap call button. Know what you're walking into before you call back.",
  },
];

const STATS = [
  {
    stat: "100×",
    label: "more likely to make contact responding in 5 min vs. 30 min",
    source: "MIT / Lead Response Management Study",
  },
  {
    stat: "78%",
    label: "of customers buy from the first business to respond",
    source: "Lead Response Management Study",
  },
  {
    stat: "47 hrs",
    label: "average industry response time — the gap you're exploiting",
    source: "Drift / InsideSales.com",
  },
  {
    stat: "24–48 hrs",
    label: "IICRC mitigation window before water damage becomes mold",
    source: "IICRC S500 Standard",
  },
];

const PLANS = [
  {
    name: "Starter",
    price: "$299",
    description: "For owner-operators just getting started with lead recovery.",
    features: [
      "1 IntakePulse number",
      "Missed-call recovery SMS",
      "AI-scored lead packets",
      "Email notifications",
      "Dashboard + lead management",
      "1 follow-up text per lead",
    ],
    cta: "Start free trial",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$499",
    description: "For growing businesses with higher call volume.",
    features: [
      "Everything in Starter",
      "Embeddable website widget",
      "Priority SMS delivery",
      "Multiple team members",
      "Custom intake questions",
      "Monthly performance reports",
    ],
    cta: "Start free trial",
    highlight: true,
  },
  {
    name: "Pro",
    price: "$799",
    description: "For multi-location operators and franchises.",
    features: [
      "Everything in Growth",
      "Multiple locations / numbers",
      "CRM integrations",
      "Custom AI prompt tuning",
      "Dedicated onboarding call",
      "SLA support",
    ],
    cta: "Contact us",
    highlight: false,
  },
];

const FAQS = [
  {
    q: "Isn't missed-call text-back already a feature in tools like GoHighLevel or Podium?",
    a: "Yes — generic text-back is commoditized. What those tools don't do is send a restoration-specific intake form, score the lead by damage type and insurance status, and email you a job-value estimate before you call back. That vertical depth is what IntakePulse is built around.",
  },
  {
    q: "What happens if the caller doesn't open the text?",
    a: "IntakePulse sends one follow-up SMS roughly 4 hours later. That's it — we don't spam your prospects.",
  },
  {
    q: "Do I need to change my business phone number?",
    a: "No. You keep your existing number. IntakePulse gives you a new number that forwards calls to your real phone. If the call goes unanswered, recovery fires automatically.",
  },
  {
    q: "What verticals does IntakePulse support right now?",
    a: "Water, fire, and mold restoration is fully live. HVAC and personal injury law are in development — join the waitlist to be notified.",
  },
  {
    q: "How does the AI scoring work?",
    a: "Scores are calculated from the intake answers using restoration-specific rules (e.g. Category 3 water + hardwood floors = high urgency). GPT-4o then writes the plain-English explanation — it never changes the numbers.",
  },
  {
    q: "What's the setup time?",
    a: "Under 30 minutes. Fill out onboarding, we provision your number, paste it into settings. That's it.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-gray-900">

      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">IntakePulse</span>
          <div className="flex items-center gap-4">
            <Link href="#pricing" className="text-sm text-gray-500 hover:text-gray-700 hidden sm:block">Pricing</Link>
            <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-700">Log in</Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-full px-3.5 py-1.5 text-xs font-semibold text-orange-600 mb-6">
            Built for water, fire & mold restoration
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 leading-tight tracking-tight mb-5">
            No inbound lead<br />ever goes unanswered.
          </h1>
          <p className="text-lg text-gray-500 mb-8 max-w-xl mx-auto leading-relaxed">
            When a restoration prospect calls and no one answers, you have minutes — not hours — before they call your competitor. IntakePulse texts them instantly, captures a full intake, and emails you a scored lead packet before you even know you missed the call.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/sign-up"
              className="w-full sm:w-auto text-center font-semibold bg-orange-500 text-white px-7 py-3.5 rounded-xl hover:bg-orange-600 transition-colors text-base"
            >
              Start free trial
            </Link>
            <Link
              href="#how-it-works"
              className="w-full sm:w-auto text-center font-medium text-gray-600 px-7 py-3.5 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors text-base"
            >
              See how it works
            </Link>
          </div>
          <p className="mt-4 text-xs text-gray-400">14-day free trial · No credit card required · Setup in under 30 min</p>
        </div>
      </section>

      {/* Verticals strip */}
      <section className="border-y border-gray-100 bg-gray-50 px-6 py-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm font-medium text-gray-500">
            <span>Water Restoration</span>
            <span className="text-gray-300">·</span>
            <span>Fire Damage</span>
            <span className="text-gray-300">·</span>
            <span>Mold Remediation</span>
            <span className="text-gray-300">·</span>
            <span className="opacity-40">HVAC (coming soon)</span>
            <span className="text-gray-300 hidden sm:block">·</span>
            <span className="opacity-40">PI Law (coming soon)</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-10">The speed-to-lead problem is well documented</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {STATS.map((s) => (
              <div key={s.stat} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                <p className="text-3xl font-extrabold text-orange-500 mb-2">{s.stat}</p>
                <p className="text-sm text-gray-700 leading-snug mb-3">{s.label}</p>
                <p className="text-xs text-gray-400">{s.source}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-16 sm:py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">How it works</h2>
            <p className="text-gray-500">Four steps from missed call to qualified lead. No manual work from you.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.step} className="bg-white rounded-2xl p-6 border border-gray-200">
                <div className="text-xs font-bold text-orange-400 tracking-widest mb-3">{item.step}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value callout */}
      <section className="px-6 py-16 bg-orange-500">
        <div className="max-w-3xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-2xl sm:text-3xl font-bold text-white leading-snug mb-4">
                One captured job pays for 6+ months of the platform.
              </p>
              <p className="text-orange-100 text-sm leading-relaxed">
                Average residential restoration ticket: <strong className="text-white">$3,000–$8,000.</strong> Sewage and Cat-3 events: <strong className="text-white">$10,000–$50,000+.</strong> A single $5,000 job covers your subscription for over six months.
              </p>
            </div>
            <div className="space-y-3">
              {[
                "A missed call at 2am becomes mold by morning",
                "IICRC requires mitigation within 24–48 hours",
                "78% of buyers go with whoever responds first",
                "Your competitors are responding in 47 hours on average",
              ].map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <span className="text-orange-300 mt-0.5 shrink-0">→</span>
                  <p className="text-sm text-orange-50">{point}</p>
                </div>
              ))}
              <Link
                href="/sign-up"
                className="mt-2 inline-block font-semibold bg-white text-orange-600 px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors text-sm"
              >
                Recover your first lead free
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why not GHL/Podium */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Built for restoration, not everyone</h2>
            <p className="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
              GoHighLevel, Podium, Birdeye, and Weave all do missed-call text-back. None of them know what Category 3 water is.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              {
                label: "Generic tools send a text",
                sub: "\"Thanks for calling, we'll get back to you.\"",
                dim: true,
              },
              {
                label: "IntakePulse captures the job",
                sub: "8-question intake tuned to water/fire/mold. Damage type, insurance status, affected rooms, severity — all scored before you call back.",
                dim: false,
              },
              {
                label: "Generic tools give you a notification",
                sub: "\"New missed call from +1 (555) 000-0000.\"",
                dim: true,
              },
              {
                label: "IntakePulse gives you a lead packet",
                sub: "Urgency score, estimated job value, AI reasoning, and a one-tap call button — formatted for a restoration operator, not a generic sales team.",
                dim: false,
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-2xl p-5 border ${item.dim ? "bg-gray-50 border-gray-200 opacity-60" : "bg-white border-orange-200"}`}
              >
                <p className={`text-sm font-bold mb-1.5 ${item.dim ? "text-gray-500" : "text-gray-900"}`}>{item.label}</p>
                <p className={`text-sm leading-relaxed ${item.dim ? "text-gray-400 italic" : "text-gray-600"}`}>{item.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-16 sm:py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">Simple pricing</h2>
            <p className="text-gray-500">One recovered job pays for the whole year.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-2xl border p-7 flex flex-col ${
                  plan.highlight
                    ? "border-orange-400 bg-orange-500 text-white shadow-lg"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlight && (
                  <div className="text-xs font-bold text-orange-200 uppercase tracking-widest mb-3">Most popular</div>
                )}
                <div className="mb-4">
                  <p className={`text-sm font-semibold mb-1 ${plan.highlight ? "text-orange-100" : "text-gray-500"}`}>
                    {plan.name}
                  </p>
                  <p className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                    {plan.price}
                    <span className={`text-base font-normal ml-1 ${plan.highlight ? "text-orange-200" : "text-gray-400"}`}>/mo</span>
                  </p>
                  <p className={`text-sm mt-2 leading-snug ${plan.highlight ? "text-orange-100" : "text-gray-500"}`}>
                    {plan.description}
                  </p>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <svg
                        className={`w-4 h-4 shrink-0 mt-0.5 ${plan.highlight ? "text-orange-200" : "text-orange-500"}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className={plan.highlight ? "text-orange-50" : "text-gray-600"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.name === "Pro" ? "mailto:hello@intakepulse.com" : "/sign-up"}
                  className={`text-center text-sm font-semibold py-3 rounded-xl transition-colors ${
                    plan.highlight
                      ? "bg-white text-orange-600 hover:bg-orange-50"
                      : "bg-orange-500 text-white hover:bg-orange-600"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-xs text-gray-400 mt-6">All plans include a 14-day free trial. Cancel any time.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 sm:py-20">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-10 text-center">Frequently asked questions</h2>
          <div className="space-y-6">
            {FAQS.map((faq) => (
              <div key={faq.q} className="border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-gray-900 mb-2">{faq.q}</p>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="px-6 py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Ready to stop losing leads to voicemail?</h2>
          <p className="text-gray-500 mb-7 text-sm">Set up in under 30 minutes. First lead recovery is on us.</p>
          <Link
            href="/sign-up"
            className="inline-block font-semibold bg-orange-500 text-white px-8 py-3.5 rounded-xl hover:bg-orange-600 transition-colors"
          >
            Start free trial
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <span className="font-semibold text-gray-600">IntakePulse</span>
          <div className="flex gap-5">
            <Link href="/legal/terms" className="hover:text-gray-600">Terms</Link>
            <Link href="/legal/privacy" className="hover:text-gray-600">Privacy</Link>
            <Link href="/legal/sms" className="hover:text-gray-600">SMS Policy</Link>
            <a href="mailto:hello@intakepulse.com" className="hover:text-gray-600">Contact</a>
          </div>
          <span>© {new Date().getFullYear()} IntakePulse</span>
        </div>
      </footer>

    </div>
  );
}
