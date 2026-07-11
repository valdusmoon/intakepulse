import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import { JsonLd, breadcrumbSchema } from "@/components/marketing/JsonLd";
import { POSTS } from "@/lib/marketing/posts";
import { formatDate } from "@/lib/marketing/date";

export const metadata: Metadata = {
  title: "Blog | Callverted",
  description:
    "Practical writing for home-service owners on missed calls, lead response speed, after-hours coverage, and turning unanswered calls into booked jobs.",
  alternates: { canonical: "/blog" },
};

export default function BlogIndex() {
  const posts = [...POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
  return (
    <MarketingShell>
      <JsonLd data={breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }])} />

      <section className="px-6 pt-16 pb-8 sm:pt-20 max-w-3xl mx-auto text-center">
        <p className="text-xs font-bold text-landing-primary uppercase tracking-widest mb-2">Blog</p>
        <h1 className="font-cv-heading text-3xl sm:text-[42px] font-bold leading-tight mb-4">The cost of a missed call, and how to close it</h1>
        <p className="text-[#667085] leading-relaxed">Straight talk for home-service owners on response speed, after-hours coverage, and winning the calls you can&apos;t answer.</p>
      </section>

      <section className="px-6 pb-20 max-w-3xl mx-auto">
        <div className="grid gap-6">
          {posts.map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="group grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-5 rounded-2xl border border-[#e3e7ed] bg-white p-4 hover:border-landing-primary/40 hover:shadow-sm transition-all"
            >
              <div className="overflow-hidden rounded-xl bg-[#0b1226] aspect-[1200/630] sm:aspect-auto">
                <Image
                  src={p.image}
                  alt={p.imageAlt}
                  width={400}
                  height={210}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                  sizes="(max-width: 640px) 100vw, 200px"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-cv-mono text-[#98a2b3] mb-1.5">{formatDate(p.date)} · {p.readMinutes} min read</div>
                <h2 className="font-cv-heading text-xl font-bold text-[#152033] group-hover:text-landing-primary transition-colors">{p.title}</h2>
                <p className="mt-2 text-sm text-[#667085] leading-relaxed">{p.excerpt}</p>
                <span className="mt-2 inline-block text-sm font-semibold text-landing-primary">Read more →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </MarketingShell>
  );
}
