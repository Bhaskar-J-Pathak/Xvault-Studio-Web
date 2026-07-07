import type { Metadata } from "next";
import Navbar           from "@/components/landing/Navbar";
import Hero             from "@/components/landing/Hero";
import FeaturesShowcase from "@/components/landing/FeaturesShowcase";
import CoAuthorSection  from "@/components/landing/CoAuthorSection";
import WhyXvault        from "@/components/landing/WhyXvault";
import HowItWorks       from "@/components/landing/HowItWorks";
import SocialProof      from "@/components/landing/SocialProof";
import FAQ              from "@/components/landing/FAQ";
import Pricing          from "@/components/landing/Pricing";
import CTA              from "@/components/landing/CTA";
import Footer           from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Xvault Studio — AI Writing Studio for Novelists",
  description:
    "Write your novel with AI that actually knows your story. Your AI co-author lives alongside your canvas, loaded with your entire manuscript. Free 14-day trial.",
  alternates: { canonical: "https://xvault.dev" },
  openGraph: {
    title: "Xvault Studio — AI Writing Studio for Novelists",
    description:
      "Write your novel with AI that actually knows your story. Your AI co-author lives alongside your canvas, loaded with your entire manuscript. Free 14-day trial.",
    url: "https://xvault.dev",
    type: "website",
  },
};

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <FeaturesShowcase />
        <CoAuthorSection />
        <WhyXvault />
        <HowItWorks />
        <SocialProof />
        <FAQ />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
