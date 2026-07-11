import { MetadataRoute } from "next";
import { INDUSTRIES } from "@/lib/marketing/industries";
import { COMPARISONS } from "@/lib/marketing/comparisons";
import { POSTS } from "@/lib/marketing/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://callverted.com";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/industries`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${baseUrl}/blog`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${baseUrl}/legal/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/refunds`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${baseUrl}/legal/sms`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const industryPages: MetadataRoute.Sitemap = INDUSTRIES.map((i) => ({
    url: `${baseUrl}/industries/${i.slug}`,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const comparePages: MetadataRoute.Sitemap = COMPARISONS.map((c) => ({
    url: `${baseUrl}/compare/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = POSTS.map((p) => ({
    url: `${baseUrl}/blog/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: "yearly",
    priority: 0.5,
  }));

  return [...staticPages, ...industryPages, ...comparePages, ...blogPages].map((p) => ({
    lastModified: now,
    ...p,
  }));
}
