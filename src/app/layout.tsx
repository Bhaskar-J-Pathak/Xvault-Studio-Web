import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Fraunces } from "next/font/google";
import Script from "next/script";
import { Suspense } from "react";
import PostHogProvider from "@/components/posthog-provider";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["SOFT", "WONK", "opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Xvault Studio — AI Writing Studio for Novelists",
    template: "%s | Xvault Studio",
  },
  description:
    "A browser-based writing studio for novelists. Your AI co-author lives alongside your canvas — loaded with your entire manuscript, so it always knows your characters, your world, and where the story is going. Free 14-day trial, no credit card.",
  keywords: [
    "AI writing tool for novels",
    "AI co-author for fiction",
    "plot thread tracker for writers",
    "world building tool fiction",
    "novel writing software",
    "fiction writing app",
    "character consistency checker writing",
    "AI ghostwriting",
    "story bible",
    "NaNoWriMo writing app",
    "xvault studio",
  ],
  authors: [{ name: "Xvault Studio", url: "https://xvault.dev" }],
  creator: "Xvault Studio",
  metadataBase: new URL("https://xvault.dev"),
  alternates: { canonical: "https://xvault.dev" },
  openGraph: {
    title: "Xvault Studio — AI Writing Studio for Novelists",
    description:
      "Write your novel with AI that actually knows your story. Your AI co-author lives alongside your canvas, loaded with your entire manuscript. Free 14-day trial.",
    url: "https://xvault.dev",
    siteName: "Xvault Studio",
    type: "website",
    locale: "en_US",
    images: [
      {
        url: "/OG.png",
        width: 1200,
        height: 630,
        alt: "Xvault Studio — AI Writing Studio for Novelists",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Xvault Studio — AI Writing Studio for Novelists",
    description:
      "Write your novel with AI that actually knows your story. Your AI co-author lives alongside your canvas, loaded with your entire manuscript. Free 14-day trial.",
    images: ["/OG.png"],
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/XVault.svg",
    shortcut: "/XVault.svg",
    apple: "/XVault.svg",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Xvault Studio",
  applicationCategory: "WritingApplication",
  applicationSubCategory: "Fiction Writing Software",
  operatingSystem: "Any (browser-based)",
  description:
    "An AI co-author for fiction writers that reads your entire manuscript before it says a word. Features AI ghost writing in your voice, automatic world board entity extraction, story bible with semantic search, plot thread tracking with dead-branch detection, and global character rename across your full manuscript.",
  url: "https://xvault.dev",
  featureList: [
    "AI co-author that reads your full manuscript (Alex)",
    "Ghost writing in your voice via Ctrl+K",
    "World board — automatic character, location, and faction extraction",
    "Story bible with semantic search across your manuscript",
    "Plot thread tracking and dead-branch detection",
    "Global character rename with context and voice preservation",
    "14-day free trial with 100 AI credits included",
    "Browser-based — no download or installation required",
    "Auto-saves every 2 seconds",
  ],
  browserRequirements: "Requires a modern web browser (Chrome, Firefox, Safari, or Edge)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "Free to start — 100 AI credits included in 14-day trial, no credit card required",
  },
  publisher: {
    "@type": "Organization",
    name: "Xvault Studio",
    url: "https://xvault.dev",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Xvault Studio",
  url: "https://xvault.dev",
  logo: "https://xvault.dev/XVault.svg",
  description:
    "Xvault Studio builds AI writing tools for fiction authors. Our flagship product gives novelists an AI co-author that reads their entire manuscript before offering suggestions.",
  foundingDate: "2026",
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Xvault Studio",
  url: "https://xvault.dev",
  description:
    "AI co-author for fiction writers — reads your entire manuscript before it says a word.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${fraunces.variable} antialiased`}
      >
        <Suspense>
          <PostHogProvider>
            {children}
          </PostHogProvider>
        </Suspense>
        <Script
          id="schema-software"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
        />
        <Script
          id="schema-organization"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <Script
          id="schema-website"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </body>
    </html>
  );
}
