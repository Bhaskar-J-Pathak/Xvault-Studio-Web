import type { Metadata } from "next";
import { LandingShell }   from "@/components/landing/LandingShell";
import Navbar             from "@/components/landing/Navbar";
import Hero               from "@/components/landing/Hero";
import FeaturesShowcase   from "@/components/landing/FeaturesShowcase";
import CoAuthorSection    from "@/components/landing/CoAuthorSection";
import WhyXvault          from "@/components/landing/WhyXvault";
import HowItWorks         from "@/components/landing/HowItWorks";
import SocialProof        from "@/components/landing/SocialProof";
import FAQ                from "@/components/landing/FAQ";
import Pricing            from "@/components/landing/Pricing";
import CTA                from "@/components/landing/CTA";
import Footer             from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Xvault Studio | AI Writing Studio for Novelists",
  description:
    "Write your novel with AI that actually knows your story. It reads your entire manuscript so continuity, what-ifs, and stuck scenes stay yours. Free 14-day trial.",
  alternates: { canonical: "https://xvault.dev" },
  openGraph: {
    title: "Xvault Studio | AI Writing Studio for Novelists",
    description:
      "Write your novel with AI that actually knows your story. It reads your entire manuscript so continuity, what-ifs, and stuck scenes stay yours. Free 14-day trial.",
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
    "AI writing studio for novelists. Reads your entire manuscript before suggesting anything, so every suggestion fits your characters, world, and voice.",
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
    "AI writing studio for fiction novelists. Manuscript-aware story memory, automatic world board, story bible, and voice-matched prose generation.",
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
  name: "How to write your novel with Xvault Studio",
  description: "Start writing your novel with an AI studio that reads your entire manuscript. No download or configuration required.",
  totalTime: "PT10M",
  step: [
    {
      "@type": "HowToStep",
      position: 1,
      name: "Sign Up",
      text: "Create a free account in under 10 seconds. No credit card required. You get 100 AI credits and 14 days of full access.",
    },
    {
      "@type": "HowToStep",
      position: 2,
      name: "Start your story",
      text: "Give your project a title and open the studio. Alex reads everything you write from the first sentence. A short tutorial walks you through Alex, inline suggestions, World Board, and Story Bible as you go.",
    },
    {
      "@type": "HowToStep",
      position: 3,
      name: "Write",
      text: "Write on the canvas while Alex lives in a panel alongside it, loaded with your entire manuscript. Place the cursor and click Write for an inline prose suggestion. No switching tabs or copy-pasting context.",
    },
    {
      "@type": "HowToStep",
      position: 4,
      name: "Finish your draft",
      text: "Your manuscript is auto-saved to the cloud every 2 seconds and accessible on any device. When done, export as a Word document from the sidebar.",
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
        <CoAuthorSection />
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
