import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { EB_Garamond } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const garamond = EB_Garamond({
  variable: "--font-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "700", "800"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Xvault Studio | The AI Story OS for Novelists",
  description:
    "Xvault Studio is a browser-based writing workspace for novelists — with real-time worldbuilding, dead-branch detection, global edits, and AI ghostwriting in your voice.",
  keywords: [
    "AI writing app",
    "novel writing software",
    "author productivity app",
    "worldbuilding software",
    "xvault studio",
    "AI story OS",
  ],
  authors: [{ name: "Xvault Studio" }],
  creator: "XVault Studio",
  metadataBase: new URL("https://xvault.dev"),
  alternates: { canonical: "https://xvault.dev" },
  openGraph: {
    title: "Xvault Studio | The AI Story OS for Novelists",
    description:
      "Real-time worldbuilding, dead-branch detection, and AI ghostwriting in your voice.",
    url: "https://xvault.dev",
    siteName: "Xvault Studio",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Xvault Studio | The AI Story OS for Novelists",
    description:
      "Real-time worldbuilding, dead-branch detection, and AI ghostwriting in your voice.",
  },
  robots: { index: true, follow: true },
  icons: {
    icon: "/XVault.svg",
    shortcut: "/XVault.svg",
    apple: "/XVault.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} ${garamond.variable} antialiased`}
      >
        {children}
        <Script
          id="schema-org"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Xvault Studio",
              applicationCategory: "WritingApplication",
              operatingSystem: "Any (browser-based)",
              description: "The AI Story OS for Novelists.",
              url: "https://xvault.dev",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
                description: "Free to start — 100 AI credits included",
              },
              publisher: {
                "@type": "Organization",
                name: "XVault Studio",
                url: "https://xvault.dev",
              },
            }),
          }}
        />
      </body>
    </html>
  );
}
