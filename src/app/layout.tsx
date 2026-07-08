import type { Metadata } from "next";
import { Geist, Geist_Mono, Sora, Inter, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { ToastProvider } from "@/contexts/ToastContext";
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

export const metadata: Metadata = {
  title: "Callverted: AI voice overflow for home service businesses",
  description: "Callverted answers missed emergency service calls live, qualifies the job, estimates value, and turns unanswered calls into callback-ready leads.",
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "Callverted: AI voice overflow for home service businesses",
    description: "Callverted answers missed emergency service calls live, qualifies the job, and estimates value before you ever call back.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} ${sora.variable} ${inter.variable} ${hankenGrotesk.variable} ${jetbrainsMono.variable} antialiased`}>
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
