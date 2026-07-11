import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import { JsonLd, breadcrumbSchema } from "@/components/marketing/JsonLd";

export const metadata: Metadata = {
  title: "About Callverted | AI Voice Overflow for the Trades",
  description:
    "Callverted was built for home-service businesses that lose urgent calls to voicemail. Our mission: make sure the calls your team can't take still become qualified leads.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "About", path: "/about" }])} />

      <section className="px-6 pt-16 pb-10 sm:pt-20 max-w-3xl mx-auto">
        <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">About</p>
        <h1 className="font-cv-heading text-3xl sm:text-[42px] font-bold leading-tight mb-5">
          The calls you miss shouldn&apos;t become someone else&apos;s jobs.
        </h1>
        <div className="space-y-5 text-[#475467] leading-relaxed text-[17px]">
          <p>
            Callverted started from a simple, expensive observation: home-service businesses win or lose jobs on the
            phone, and the most valuable calls arrive exactly when no one can answer them — nights, weekends, and the
            middle of a job.
          </p>
          <p>
            A homeowner with a flooding basement or a dead furnace doesn&apos;t leave a voicemail. They call the next
            company on the list. For a plumber, an HVAC company, or a restoration crew, that&apos;s not a missed call —
            it&apos;s a four- or five-figure job handed to a competitor, plus the referrals that would have followed.
          </p>
          <p>
            So we built an AI that answers the calls your team can&apos;t. Not an open-ended chatbot pretending to be a
            receptionist — a rigid, trade-specific intake that asks the questions that actually decide the job, estimates
            its value, reassures the caller, and hands you a ranked, callback-ready lead within minutes.
          </p>
          <p>
            The principle underneath it: <strong className="text-[#152033]">code owns the workflow, not the AI.</strong>{" "}
            The model only ever listens, classifies, and speaks fixed lines. It never improvises pricing, never invents
            details, and never controls where the call goes. That&apos;s what makes it safe to put in front of your
            customers.
          </p>
        </div>
      </section>

      <section className="px-6 py-14 bg-white border-y border-[#e3e7ed]">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-cv-heading text-2xl font-bold mb-6">What we believe</h2>
          <ul className="space-y-4 text-[#475467] leading-relaxed">
            {[
              "Speed wins. The first business to answer usually gets the job — so the calls you can't take still need a fast, capable answer.",
              "Your team comes first. Callverted only steps in when a call would otherwise be missed. It never gets between you and a customer you can serve.",
              "No invented prices. Caller-facing guidance only comes from ranges you approve. When in doubt, it says your team will confirm.",
              "A lead, not a message. You should hang up knowing who called, what they need, how urgent it is, and what it's worth.",
            ].map((b, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-primary" />
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-6 py-16 text-center">
        <Link href="/sign-up" className="inline-block font-semibold bg-landing-primary text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-colors">
          Start 14-day trial
        </Link>
      </section>
    </MarketingShell>
  );
}
