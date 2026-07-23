import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import { JsonLd, faqSchema, breadcrumbSchema } from "@/components/marketing/JsonLd";
import { INDUSTRIES, getIndustry } from "@/lib/marketing/industries";

export function generateStaticParams() {
  return INDUSTRIES.map((i) => ({ slug: i.slug }));
}

// Headline grammar per trade. `name` is the SEO display name ("Water, Fire & Mold
// Restoration") and reads badly inside a sentence, and lowercasing it mangles
// "HVAC" — so headings use these instead.
const OPERATORS: Record<string, string> = {
  hvac: "HVAC companies",
  plumbing: "plumbers",
  restoration: "restoration companies",
  electrical: "electricians",
  "general-contracting": "contractors",
};
const CALL_ADJECTIVE: Record<string, string> = {
  hvac: "HVAC",
  plumbing: "plumbing",
  restoration: "restoration",
  electrical: "electrical",
  "general-contracting": "project",
};

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) return {};
  return {
    title: industry.metaTitle,
    description: industry.metaDescription,
    alternates: { canonical: `/industries/${industry.slug}` },
    openGraph: { title: industry.metaTitle, description: industry.metaDescription, type: "website" },
  };
}

export default async function IndustryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const industry = getIndustry(slug);
  if (!industry) notFound();

  const related = industry.related.map(getIndustry).filter(Boolean);
  const operators = OPERATORS[industry.slug] ?? `${industry.navLabel} companies`;
  const callAdjective = CALL_ADJECTIVE[industry.slug] ?? industry.navLabel;

  return (
    <MarketingShell>
      <JsonLd
        data={[
          faqSchema(industry.faqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Industries", path: "/industries" },
            { name: industry.name, path: `/industries/${industry.slug}` },
          ]),
        ]}
      />

      {/* Hero */}
      <section className="px-6 pt-14 pb-12 sm:pt-20 max-w-4xl mx-auto">
        <nav className="text-[12px] text-[#98a2b3] mb-6" aria-label="Breadcrumb">
          <Link href="/industries" className="hover:text-[#667085]">Industries</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#667085]">{industry.name}</span>
        </nav>
        <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-3">{industry.name}</p>
        <h1 className="font-cv-heading text-3xl sm:text-[42px] font-bold leading-[1.1] mb-5 max-w-3xl">{industry.h1}</h1>
        <p className="text-lg text-[#667085] leading-relaxed max-w-2xl mb-8">{industry.heroSub}</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/sign-up" className="font-semibold bg-landing-primary text-white px-7 py-3.5 rounded-xl hover:bg-blue-600 transition-colors">
            Start 14-day trial
          </Link>
          <Link href="/#demo" className="font-medium text-[#152033] px-7 py-3.5 rounded-xl border border-[#d0d5dd] hover:bg-white transition-colors">
            See it work
          </Link>
        </div>
      </section>

      {/* Pain points */}
      <section className="px-6 py-14 bg-white border-y border-[#e3e7ed]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-cv-heading text-2xl font-bold mb-6">Why {operators} lose these calls</h2>
          <ul className="space-y-4">
            {industry.painPoints.map((p, i) => (
              <li key={i} className="flex items-start gap-3 text-[#475467] leading-relaxed">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-primary" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Scenario + capture */}
      <section className="px-6 py-16 max-w-4xl mx-auto">
        <h2 className="font-cv-heading text-2xl font-bold mb-2 text-center">A real call, captured</h2>
        <p className="text-[#667085] text-center mb-8 max-w-xl mx-auto">Here&apos;s the kind of call your team can&apos;t always take, and exactly what Callverted hands you afterward.</p>
        <div className="grid gap-4 md:grid-cols-2 items-start">
          <div className="rounded-2xl border border-[#e3e7ed] bg-white p-6">
            <div className="text-[11px] font-cv-mono uppercase tracking-wide text-[#98a2b3] mb-3">{industry.scenario.time}</div>
            <div className="flex justify-end mb-2">
              <div className="max-w-[90%] rounded-2xl rounded-br-sm bg-landing-primary text-white px-4 py-3 text-sm leading-relaxed">
                {industry.scenario.caller}
              </div>
            </div>
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-sm bg-[#f2f4f7] text-[#475467] px-4 py-3 text-sm">
                Answered live by Callverted. No voicemail.
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-landing-primary/25 bg-landing-primary/[0.04] p-6">
            <div className="text-[11px] font-bold uppercase tracking-widest text-landing-primary mb-3">What you receive</div>
            <dl className="space-y-2">
              {industry.scenario.captured.map((c) => (
                <div key={c.label} className="flex justify-between gap-3 text-sm border-b border-[#e3e7ed]/60 pb-2 last:border-0">
                  <dt className="text-[#667085]">{c.label}</dt>
                  <dd className="font-semibold text-[#152033] text-right">{c.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-[12px] leading-relaxed text-[#667085]">
              Plus a short summary and the full transcript on every lead, pushed to your phone and emailed the moment the
              call wraps.
            </p>
          </div>
        </div>
      </section>

      {/* What it asks */}
      <section className="px-6 py-14 bg-white border-y border-[#e3e7ed]">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-cv-heading text-2xl font-bold mb-2">What Callverted asks on {callAdjective} calls</h2>
          <p className="text-[#667085] mb-6 max-w-2xl">
            Three questions out loud, in this order: what happened, how urgent it is, and where. Everything else is picked
            up only if the caller volunteers it. There&apos;s no name to spell, no &ldquo;what&apos;s the best time to call
            you back,&rdquo; and no request for a phone number, because that comes from caller ID.
          </p>
          <ol className="space-y-3">
            {industry.asks.map((a, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="grid place-items-center h-6 w-6 shrink-0 rounded-full bg-landing-primary/10 text-landing-primary text-[12px] font-bold">{i + 1}</span>
                <span className="text-[#475467] leading-relaxed pt-0.5">{a}</span>
              </li>
            ))}
          </ol>
          <p className="mt-6 text-sm text-[#98a2b3]">
            Benchmark job value for this trade: <span className="font-semibold text-[#667085]">{industry.valueRange}</span>.
            Once you&apos;ve priced your own services in Settings, the estimate on every lead comes from your numbers instead
            of these. It&apos;s used for ranking only and is never spoken to the caller.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16 max-w-3xl mx-auto">
        <h2 className="font-cv-heading text-2xl font-bold mb-6 text-center">{industry.navLabel} questions, answered</h2>
        <div className="space-y-3">
          {industry.faqs.map((f, i) => (
            <details key={i} className="group rounded-xl border border-[#e3e7ed] bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#152033]">
                {f.q}
                <span className="text-[#98a2b3] transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm text-[#667085] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related + CTA */}
      <section className="px-6 py-16 bg-landing-ink text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-cv-heading text-2xl sm:text-3xl font-bold mb-3">Stop losing the {callAdjective} calls you can&apos;t take.</h2>
          <p className="text-white/55 mb-7 max-w-xl mx-auto">Your phones still ring first. Callverted catches what rings out, sorts the real jobs from the messages, and hands them back ranked. Switch on answered-call capture and the calls you do take become tracked leads too.</p>
          <Link href="/sign-up" className="inline-block font-semibold bg-landing-primary text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-colors">
            Start 14-day trial
          </Link>
          {related.length > 0 && (
            <div className="mt-10 flex flex-wrap justify-center gap-2.5">
              <span className="text-[12px] text-white/40 self-center">Also for:</span>
              {related.map((r) => (
                <Link key={r!.slug} href={`/industries/${r!.slug}`} className="rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-white/70 hover:bg-white/10 transition-colors">
                  {r!.navLabel}
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </MarketingShell>
  );
}
