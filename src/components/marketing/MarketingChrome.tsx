import Link from "next/link";
import { CallvertedLogo } from "@/components/CallvertedLogo";
import { AuthAwareNavCta } from "@/components/marketing/AuthAwareNavCta";
import { INDUSTRIES } from "@/lib/marketing/industries";

/**
 * Shared nav + footer for the marketing subpages (industries, faq, about, blog,
 * compare). The landing page keeps its own hash-anchor nav; these subpages get a
 * nav whose links point back to landing sections and across to the SEO pages, so
 * every page cross-links (good for crawl depth and internal PageRank).
 */

/** Page wrapper: nav on top, content on the light paper background, rich footer
 *  below. Used by every marketing subpage so chrome stays consistent. */
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-landing-paper text-[#152033] flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}

export function MarketingNav() {
  return (
    <nav className="border-b border-white/10 bg-landing-ink px-6 py-4 text-white">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <CallvertedLogo className="h-8 w-8" gradientId="cvLogoSubNav" />
          <span className="font-cv-heading text-lg font-bold tracking-tight">Callverted</span>
        </Link>
        <div className="flex items-center gap-5">
          <Link href="/#how" className="text-sm text-white/60 hover:text-white transition-colors hidden md:block">How it works</Link>
          <Link href="/industries" className="text-sm text-white/60 hover:text-white transition-colors hidden md:block">Industries</Link>
          <Link href="/#pricing" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">Pricing</Link>
          <Link href="/faq" className="text-sm text-white/60 hover:text-white transition-colors hidden md:block">FAQ</Link>
          <AuthAwareNavCta />
        </div>
      </div>
    </nav>
  );
}

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-3">{title}</div>
      <ul className="flex flex-col gap-2 text-sm text-white/60">{children}</ul>
    </div>
  );
}

function FLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <li>
      <Link href={href} className="hover:text-white transition-colors">{children}</Link>
    </li>
  );
}

export function MarketingFooter() {
  return (
    <footer className="relative overflow-hidden bg-landing-ink text-white border-t border-white/10">
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-14">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-5">
          <div className="col-span-2 sm:col-span-4 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <CallvertedLogo className="h-7 w-7" gradientId="cvLogoFooterCol" />
              <span className="font-cv-heading text-base font-bold">Callverted</span>
            </Link>
            <p className="mt-3 text-[13px] text-white/45 leading-relaxed max-w-[220px]">
              The missed-call lead recovery service for home-service trades. We answer the calls your team can&apos;t, then hand back ranked, callback-ready leads.
            </p>
          </div>

          <Col title="Product">
            <FLink href="/#how">How it works</FLink>
            <FLink href="/#product">Lead packet</FLink>
            <FLink href="/#pricing">Pricing</FLink>
            <FLink href="/faq">FAQ</FLink>
          </Col>

          <Col title="Industries">
            {INDUSTRIES.map((i) => (
              <FLink key={i.slug} href={`/industries/${i.slug}`}>{i.navLabel}</FLink>
            ))}
          </Col>

          <Col title="Compare">
            <FLink href="/compare/voicemail">vs. Voicemail</FLink>
            <FLink href="/compare/missed-call-text-back">vs. Text-back</FLink>
            <FLink href="/compare/answering-service">vs. Answering service</FLink>
          </Col>

          <Col title="Company">
            <FLink href="/about">About</FLink>
            <FLink href="/blog">Blog</FLink>
            <li><a href="mailto:hello@callverted.com" className="hover:text-white transition-colors">Contact</a></li>
            <FLink href="/legal/terms">Terms</FLink>
            <FLink href="/legal/privacy">Privacy</FLink>
          </Col>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-xs text-white/40">
          © {new Date().getFullYear()} Callverted. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
