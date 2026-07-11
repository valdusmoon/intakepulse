import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora, Inter, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/contexts/ToastContext";
import { JsonLd } from "@/components/marketing/JsonLd";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

// Dashboard design system fonts — headings + mono numerals, applied via
// Tailwind utilities scoped to the authenticated app (not global by default).
const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-hanken-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["500", "600"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://callverted.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Callverted | AI Call Answering for the Trades",
    template: "%s",
  },
  description: "Callverted answers missed emergency service calls live, qualifies the job, estimates value, and turns unanswered calls into callback-ready leads.",
  applicationName: "Callverted",
  keywords: [
    "AI receptionist",
    "missed call recovery",
    "AI call answering",
    "HVAC answering service",
    "plumber answering service",
    "restoration lead recovery",
    "home service lead capture",
    "after-hours call handling",
  ],
  alternates: { canonical: "/" },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Callverted | AI Call Answering for the Trades",
    description: "Callverted answers missed emergency service calls live, qualifies the job, and estimates value before you ever call back.",
    url: SITE_URL,
    siteName: "Callverted",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Callverted | AI Call Answering for the Trades",
    description: "Answer the emergency calls your team can't, qualify the job, and get a ranked lead in minutes.",
    images: ["/og-image.png"],
  },
};

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Callverted",
  url: SITE_URL,
  logo: `${SITE_URL}/apple-touch-icon.png`,
  description: "AI voice overflow for urgent home-service calls.",
  contactPoint: { "@type": "ContactPoint", email: "hello@callverted.com", contactType: "sales" },
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Callverted",
  url: SITE_URL,
};

const SOFTWARE_JSONLD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Callverted",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  description: "AI call answering that qualifies missed home-service calls into ranked, callback-ready leads.",
  offers: { "@type": "Offer", price: "79", priceCurrency: "USD" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${inter.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
        <JsonLd data={[ORGANIZATION_JSONLD, WEBSITE_JSONLD, SOFTWARE_JSONLD]} />
        <ThemeProvider>
          <ErrorBoundary>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}
