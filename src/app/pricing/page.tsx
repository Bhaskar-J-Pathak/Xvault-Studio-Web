import { Metadata } from "next";
import Pricing from "../../components/landing/Pricing";
import { getUser } from "@/lib/auth";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pricing | Xvault Studio",
  description: "Start Xvault Studio free for 14 days with 100 AI credits and no credit card. Upgrade to Hobbyist for $11.99/month, or join the limited Founder's Circle for $49.",
  alternates: { canonical: "https://xvault.dev/pricing" },
};

const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Xvault Studio",
  applicationCategory: "WritingApplication",
  url: "https://xvault.dev",
  offers: [
    {
      "@type": "Offer",
      name: "Free Trial",
      price: "0",
      priceCurrency: "USD",
      description: "14-day free trial with 100 AI credits. No credit card required.",
    },
    {
      "@type": "Offer",
      name: "Hobbyist Monthly",
      price: "11.99",
      priceCurrency: "USD",
      billingIncrement: "P1M",
      description: "300 AI credits per month. Full access to Alex, World Board, Story Bible, and Ghost Writing.",
    },
    {
      "@type": "Offer",
      name: "Founder's Circle",
      price: "49",
      priceCurrency: "USD",
      description: "One-time lifetime access. 500 AI credits per month. Limited to 30 seats.",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How much does Xvault Studio cost?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault Studio costs $11.99 per month or $119 per year for the Hobbyist plan. There is also a one-time Founder's Circle lifetime access for $49. A free 14-day trial with 100 AI credits is available with no credit card required.",
      },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Xvault Studio offers a 14-day free trial with 100 AI credits and no credit card required. This gives full access to Alex, the World Board, Story Bible, and Ghost Writing features.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Founder's Circle?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Founder's Circle is a one-time $49 founding membership limited to 30 writers. It includes 500 AI credits per month, direct founder access, and a voice in shaping the product.",
      },
    },
    {
      "@type": "Question",
      name: "What are AI credits?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "AI credits are used each time you interact with Alex, generate an inline suggestion, or run a continuity check. The Hobbyist plan includes 300 credits per month. The Founder's Circle includes 500 credits per month.",
      },
    },
  ],
};

export default async function PricingPage() {
  const user = await getUser();

  return (
    <div className="min-h-screen bg-[#F8F5FF]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      {/* Top bar for logged-in users */}
      {user && (
        <div className="border-b border-violet-200/60 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
            <span className="text-sm text-violet-700">
              Signed in as <span className="font-medium">{user.email}</span>
            </span>
            <Link
              href="/dashboard"
              className="text-sm font-medium text-violet-600 hover:text-violet-800 transition"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      )}

      <Pricing />
    </div>
  );
}
