import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import { JsonLd, faqSchema, breadcrumbSchema } from "@/components/marketing/JsonLd";
import { FAQS } from "@/lib/marketing/faqs";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | Callverted",
  description:
    "Answers to common questions about Callverted — how AI voice overflow works, what you receive after a call, pricing, setup time, recording, and more.",
  alternates: { canonical: "/faq" },
};

export default function FaqPage() {
  return (
    <MarketingShell>
      <JsonLd data={[faqSchema(FAQS), breadcrumbSchema([{ name: "Home", path: "/" }, { name: "FAQ", path: "/faq" }])]} />

      <section className="px-6 pt-16 pb-8 sm:pt-20 max-w-3xl mx-auto text-center">
        <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">FAQ</p>
        <h1 className="font-cv-heading text-3xl sm:text-[42px] font-bold leading-tight mb-4">Questions owners ask first</h1>
        <p className="text-[#667085] leading-relaxed">
          Everything about how Callverted answers your missed calls, what it captures, and how to get started.
        </p>
      </section>

      <section className="px-6 pb-16 max-w-3xl mx-auto">
        <div className="space-y-3">
          {FAQS.map((f, i) => (
            <details key={i} className="group rounded-xl border border-[#e3e7ed] bg-white p-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-semibold text-[#152033]">
                {f.q}
                <span className="text-[#98a2b3] transition-transform group-open:rotate-45" aria-hidden>+</span>
              </summary>
              <p className="mt-3 text-sm text-[#667085] leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>

        <div className="mt-10 text-center">
          <p className="text-[#667085] mb-4">Still have a question?</p>
          <a href="mailto:hello@callverted.com" className="font-semibold text-landing-primary hover:underline">hello@callverted.com</a>
          <div className="mt-8">
            <Link href="/sign-up" className="inline-block font-semibold bg-landing-primary text-white px-8 py-3.5 rounded-xl hover:bg-blue-600 transition-colors">
              Start 14-day trial
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
