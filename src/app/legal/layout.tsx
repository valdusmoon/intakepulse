import Link from "next/link";
import { CallvertedLogo } from "@/components/CallvertedLogo";

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Simple nav */}
      <nav className="sticky top-0 z-50 border-b border-gray-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-[1.05rem]">
            <CallvertedLogo className="w-7 h-7 rounded-lg shadow-sm" gradientId="cvLogoLegalNav" />
            Callverted
          </Link>
          <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
            Sign in →
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-14">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-6 px-6">
        <div className="max-w-3xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <span>© 2026 Callverted · Inbound lead capture for home-service businesses</span>
          <div className="flex gap-5">
            <Link href="/legal/privacy" className="hover:text-gray-700 transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-gray-700 transition-colors">Terms</Link>
            <Link href="/legal/sms" className="hover:text-gray-700 transition-colors">SMS Policy</Link>
            <Link href="/legal/refunds" className="hover:text-gray-700 transition-colors">Refund Policy</Link>
            <a href="mailto:hello@callverted.com" className="hover:text-gray-700 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
