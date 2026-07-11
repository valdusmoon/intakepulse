import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MarketingShell } from "@/components/marketing/MarketingChrome";
import { JsonLd, breadcrumbSchema, SITE_URL } from "@/components/marketing/JsonLd";
import { POSTS, getPost, type Block } from "@/lib/marketing/posts";
import { formatDate } from "@/lib/marketing/date";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.metaTitle,
    description: post.metaDescription,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.metaTitle,
      description: post.metaDescription,
      type: "article",
      publishedTime: post.date,
      images: [{ url: post.image, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", images: [post.image] },
  };
}

function renderBlock(b: Block, i: number) {
  if (b.type === "h2") return <h2 key={i} className="font-cv-heading text-2xl font-bold text-[#152033] mt-10 mb-3">{b.text}</h2>;
  if (b.type === "ul")
    return (
      <ul key={i} className="my-4 space-y-2">
        {b.items.map((it, j) => (
          <li key={j} className="flex items-start gap-3 text-[#475467] leading-relaxed">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-landing-primary" />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    );
  return <p key={i} className="my-4 text-[#475467] leading-[1.75] text-[17px]">{b.text}</p>;
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const others = POSTS.filter((p) => p.slug !== post.slug).slice(0, 2);

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.metaDescription,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: "Callverted" },
    publisher: { "@type": "Organization", name: "Callverted" },
    mainEntityOfPage: `${SITE_URL}/blog/${post.slug}`,
  };

  return (
    <MarketingShell>
      <JsonLd data={[articleSchema, breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }, { name: post.title, path: `/blog/${post.slug}` }])]} />

      <article className="px-6 pt-14 pb-16 sm:pt-20 max-w-2xl mx-auto">
        <nav className="text-[12px] text-[#98a2b3] mb-6" aria-label="Breadcrumb">
          <Link href="/blog" className="hover:text-[#667085]">Blog</Link>
          <span className="mx-1.5">/</span>
          <span className="text-[#667085]">Article</span>
        </nav>
        <div className="text-[12px] font-cv-mono text-[#98a2b3] mb-3">{formatDate(post.date)} · {post.readMinutes} min read</div>
        <h1 className="font-cv-heading text-3xl sm:text-4xl font-bold leading-[1.15] text-[#152033] mb-2">{post.title}</h1>
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#e3e7ed] bg-[#0b1226]">
          <Image
            src={post.image}
            alt={post.imageAlt}
            width={1200}
            height={630}
            priority
            className="w-full h-auto"
            sizes="(max-width: 672px) 100vw, 672px"
          />
        </div>
        <div className="mt-8 border-t border-[#e3e7ed] pt-2">
          {post.body.map(renderBlock)}
        </div>

        <div className="mt-12 rounded-2xl bg-[#f9fafb] border border-[#e3e7ed] p-6 text-center">
          <p className="font-cv-heading text-lg font-bold text-[#152033] mb-2">Stop losing the calls you can&apos;t answer.</p>
          <p className="text-sm text-[#667085] mb-4">Callverted answers them live, qualifies the job, and sends you a ranked lead.</p>
          <Link href="/sign-up" className="inline-block font-semibold bg-landing-primary text-white px-7 py-3 rounded-xl hover:bg-blue-600 transition-colors">
            Start 14-day trial
          </Link>
        </div>
      </article>

      {others.length > 0 && (
        <section className="px-6 pb-20 max-w-2xl mx-auto">
          <h2 className="font-cv-heading text-lg font-bold mb-4">Keep reading</h2>
          <div className="divide-y divide-[#e3e7ed]">
            {others.map((p) => (
              <Link key={p.slug} href={`/blog/${p.slug}`} className="group block py-4">
                <h3 className="font-semibold text-[#152033] group-hover:text-landing-primary transition-colors">{p.title}</h3>
                <p className="mt-1 text-sm text-[#667085]">{p.excerpt}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </MarketingShell>
  );
}
