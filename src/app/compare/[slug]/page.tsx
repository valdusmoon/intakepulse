import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import { JsonLd, faqSchema, breadcrumbSchema } from "@/components/marketing/JsonLd";
import { COMPARISONS, getComparison } from "@/lib/marketing/comparisons";

export function generateStaticParams() {
  return COMPARISONS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) return {};
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: { canonical: `/compare/${c.slug}` },
    openGraph: { title: c.metaTitle, description: c.metaDescription, type: "website" },
  };
}

export default async function ComparePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = getComparison(slug);
  if (!c) notFound();

  return (
    <MarketingShell>
      <JsonLd
        data={[
          faqSchema(c.faqs),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare/voicemail" },
            { name: `vs. ${c.alternative}`, path: `/compare/${c.slug}` },
          ]),
        ]}
      />

      <section className="px-6 pt-16 pb-10 sm:pt-20 max-w-3xl mx-auto">
        <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">Compare</p>
        <h1 className="font-cv-heading text-3xl sm:text-[42px] font-bold leading-tight mb-5">{c.h1}</h1>
        <p className="text-lg text-[#667085] leading-relaxed">{c.intro}</p>
      </section>

      <section className="px-6 pb-8 max-w-3xl mx-auto">
        <div className="overflow-hidden rounded-2xl border border-[#e3e7ed] bg-white">
          <div className="grid grid-cols-[1.1fr_1fr_1fr] text-[13px]">
            <div className="bg-[#f9fafb] px-4 py-3 font-bold text-[#98a2b3] uppercase tracking-wide text-[11px]"> </div>
            <div className="bg-[#f9fafb] px-4 py-3 font-bold text-[#667085]">{c.alternative}</div>
            <div className="bg-landing-primary/[0.06] px-4 py-3 font-bold text-landing-primary">Callverted</div>
            {c.rows.map((r) => (
              <div key={r.dimension} className="contents">
                <div className="border-t border-[#e3e7ed] px-4 py-3 font-semibold text-[#152033]">{r.dimension}</div>
                <div className="border-t border-[#e3e7ed] px-4 py-3 text-[#667085]">{r.them}</div>
                <div className="border-t border-[#e3e7ed] bg-landing-primary/[0.03] px-4 py-3 text-[#152033]">{r.us}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-10 max-w-3xl mx-auto">
        <div className="rounded-2xl bg-[#f9fafb] border border-[#e3e7ed] p-6">
          <div className="text-[11px] font-bold uppercase tracking-widest text-landing-primary mb-2">Bottom line</div>
          <p className="text-[#152033] leading-relaxed">{c.bottomLine}</p>
        </div>
      </section>

      <section className="px-6 pb-14 max-w-3xl mx-auto">
        <h2 className="font-cv-heading text-xl font-bold mb-4">Common questions</h2>
        <div className="space-y-3">
          {c.faqs.map((f, i) => (
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

      <section className="px-6 py-16 bg-landing-ink text-white text-center">
        <Link href="/sign-up" className="inline-block font-semibold bg-landing-primary text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-colors">
          Start 14-day trial
        </Link>
        <div className="mt-8 flex flex-wrap justify-center gap-2.5">
          <span className="text-[12px] text-white/40 self-center">Other comparisons:</span>
          {COMPARISONS.filter((o) => o.slug !== c.slug).map((o) => (
            <Link key={o.slug} href={`/compare/${o.slug}`} className="rounded-full border border-white/15 px-3.5 py-1.5 text-[13px] text-white/70 hover:bg-white/10 transition-colors">
              vs. {o.alternative}
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
