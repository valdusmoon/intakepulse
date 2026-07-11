import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import { JsonLd, breadcrumbSchema } from "@/components/marketing/JsonLd";
import { INDUSTRIES } from "@/lib/marketing/industries";

export const metadata: Metadata = {
  title: "Industries We Serve | AI Call Answering for the Trades | Callverted",
  description:
    "Callverted answers the calls your team misses across HVAC, plumbing, restoration, electrical, and general contracting, qualifying each job and sending a ranked lead.",
  alternates: { canonical: "/industries" },
};

export default function IndustriesIndex() {
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Industries", path: "/industries" }])} />

      <section className="px-6 pt-16 pb-10 sm:pt-20 max-w-5xl mx-auto text-center">
        <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">Industries</p>
        <h1 className="font-cv-heading text-3xl sm:text-[42px] font-bold leading-tight mb-4">
          Built for the calls that can&apos;t wait.
        </h1>
        <p className="text-[#667085] max-w-2xl mx-auto leading-relaxed">
          Callverted answers the urgent calls your team can&apos;t get to, qualifies the job the way your trade actually
          works, and sends a ranked, callback-ready lead. Pick your trade to see the flow.
        </p>
      </section>

      <section className="px-6 pb-20 max-w-5xl mx-auto">
        <div className="grid gap-4 sm:grid-cols-2">
          {INDUSTRIES.map((i) => (
            <Link
              key={i.slug}
              href={`/industries/${i.slug}`}
              className="group rounded-2xl border border-[#e3e7ed] bg-white p-6 hover:border-landing-primary/40 hover:shadow-lg transition-all"
            >
              <div className="flex items-center justify-between gap-3">
                <h2 className="font-cv-heading text-lg font-bold text-[#152033]">{i.name}</h2>
                <span className="text-landing-primary transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
              </div>
              <p className="mt-2 text-sm text-[#667085] leading-relaxed">{i.heroSub.split(". ")[0]}.</p>
              <p className="mt-3 text-[12px] font-cv-mono text-[#98a2b3]">{i.valueRange}</p>
            </Link>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link href="/sign-up" className="inline-block font-semibold bg-landing-primary text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-colors">
            Start 14-day trial
          </Link>
        </div>
      </section>
    </MarketingShell>
  );
}
