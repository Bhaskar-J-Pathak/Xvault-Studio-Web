import type { Metadata } from "next";
import { LandingShell }   from "@/components/landing/LandingShell";
import Navbar             from "@/components/landing/Navbar";
import Hero               from "@/components/landing/Hero";
import FeaturesShowcase   from "@/components/landing/FeaturesShowcase";
import WhyXvault          from "@/components/landing/WhyXvault";
import HowItWorks         from "@/components/landing/HowItWorks";
import SocialProof        from "@/components/landing/SocialProof";
import FAQ                from "@/components/landing/FAQ";
import Pricing            from "@/components/landing/Pricing";
import CTA                from "@/components/landing/CTA";
import Footer             from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Xvault Studio | See What Your Story Is Becoming",
  description:
    "Upload your manuscript and reveal its characters, relationships, plot threads, and emotional arcs. Scan your first chapters free with Xvault Studio.",
  alternates: { canonical: "https://xvault.dev" },
  openGraph: {
    title: "Xvault Studio | See What Your Story Is Becoming",
    description:
      "Upload your manuscript and reveal its characters, relationships, plot threads, and emotional arcs. Scan your first chapters free.",
    url: "https://xvault.dev",
    type: "website",
  },
};

const softwareSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Xvault Studio",
  applicationCategory: "WritingApplication",
  operatingSystem: "Web (Chrome, Firefox, Safari, Edge)",
  url: "https://xvault.dev",
  description:
    "A writing studio that scans a manuscript to reveal characters, relationships, plot threads, and emotional arcs, then keeps that story context available while the author writes.",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
    description: "14-day free trial. 100 AI credits. No credit card required.",
  },
  screenshot: "https://xvault.dev/XVault.svg",
};

const orgSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Xvault Studio",
  url: "https://xvault.dev",
  logo: "https://xvault.dev/XVault.svg",
  description:
    "AI writing studio for fiction novelists. Story Pulse tracks emotional arcs alongside manuscript-aware story memory, an automatic World Board, and voice-aware prose generation.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "hello@xvaultstudio.com",
    contactType: "customer support",
  },
  sameAs: [],
};

const howToSchema = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  name: "How to scan and continue your novel with Xvault Studio",
  description: "Import a manuscript, reveal the story already on the page, and keep its context in view while writing.",
  totalTime: "PT10M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Import your manuscript",
      text: "Create a free account and upload a .docx or .txt manuscript. Xvault detects its chapters without changing the original file.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Run a First Story Scan",
      text: "Scan up to three chapters to reveal characters, relationships, locations, plot threads, and emotional movement grounded in the manuscript.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Explore the story model",
      text: "Open the World Board and Story Pulse to inspect factual and emotional continuity, then decide which observations matter to the story.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Continue writing with context",
      text: "Write on the canvas while Alex and the prose tools use the manuscript context already captured by Xvault. Export the manuscript whenever you want.",
    },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is Xvault Studio free to start?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Sign up in 10 seconds, with no credit card needed. You get 100 AI credits and 14 days of full access. When you need more credits, you can choose a paid plan from the pricing page.",
      },
    },
    {
      "@type": "Question",
      name: "Is this the full product?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Xvault Studio is in public beta. The core writing experience (Alex, Ghost Writing, World Board, Story Bible, and Global Replace) is ready to use today. Beta writers get full access to the current product and can directly shape what we build next.",
      },
    },
    {
      "@type": "Question",
      name: "What exactly is Alex?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Alex is your AI co-author. Before it says a word, it reads your entire manuscript: every chapter, every character, every open thread. Ask it anything about your story, get ghost suggestions in your voice, or just talk through a plot problem. Alex always has context.",
      },
    },
    {
      "@type": "Question",
      name: "How does Ghost Writing preserve my voice?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Place the cursor anywhere in the editor and click Write. Alex generates suggestions using your existing chapters, not isolated generic output. Choose the length, preview the result, then insert, refine, or dismiss it.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my manuscript?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can export your manuscript as a Word document (.docx) from the studio sidebar at any time. EPUB and PDF export are in development and coming at full launch. Your work is always yours to take.",
      },
    },
    {
      "@type": "Question",
      name: "Is my manuscript safe in the cloud?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Your chapters are encrypted in transit and at rest. Only you can access your projects. We never use your manuscript to train AI models, and you can export or delete your data at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to install anything?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Nothing. Xvault Studio runs entirely in your browser: Chrome, Firefox, Safari, Edge. Open a tab and start writing. Your work is auto-saved to the cloud, so you can pick up on any device, anywhere.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <LandingShell>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main>
        <Hero />
        <FeaturesShowcase />
        <WhyXvault />
        <HowItWorks />
        <SocialProof />
        <FAQ />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </LandingShell>
  );
}
