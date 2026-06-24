import type { Metadata } from "next";
import Navbar      from "@/components/landing/Navbar";
import Hero        from "@/components/landing/Hero";
import WhyXvault   from "@/components/landing/WhyXvault";
import Features    from "@/components/landing/Features";
import HowItWorks  from "@/components/landing/HowItWorks";
import FAQ         from "@/components/landing/FAQ";
import CTA         from "@/components/landing/CTA";
import Footer      from "@/components/landing/Footer";

export const metadata: Metadata = {
  title: "Xvault Studio — AI Co-Author for Fiction Writers",
  description:
    "Alex reads your entire manuscript before it says a word. AI co-author, world board, plot thread tracking, and ghost writing in your voice — for fiction writers. Free 14-day trial, no credit card.",
  alternates: { canonical: "https://xvault.dev" },
  openGraph: {
    title: "Xvault Studio — AI Co-Author for Fiction Writers",
    description:
      "Alex reads your entire manuscript before it says a word. AI co-author, world board, and ghost writing in your voice. Free 14-day trial.",
    url: "https://xvault.dev",
    type: "website",
  },
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
        text: "Yes. You can sign up in under 10 seconds — no credit card required. Every new account receives 100 AI credits and 14 days of full access to all features, including the AI co-author Alex, World Board, Story Bible, Ghost Writing, and Global Replace. After the trial, a free plan remains available with a reduced monthly credit allowance.",
      },
    },
    {
      "@type": "Question",
      name: "What is Alex, the AI co-author in Xvault Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Alex is Xvault Studio's AI co-author. Unlike general-purpose AI writing tools that require you to paste in your story context every session, Alex reads your entire manuscript before it responds to anything. It knows your characters by name, tracks which plot threads are open, remembers your world-building details, and generates suggestions that are grounded in what you have actually written. You can ask Alex anything about your story, request a ghost-written passage in your voice, or talk through a plot problem.",
      },
    },
    {
      "@type": "Question",
      name: "How does Xvault Studio preserve my writing voice when using AI ghost writing?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Press Ctrl+K anywhere in the Xvault Studio editor. Alex generates a ghost suggestion based on your instruction and your existing chapters. The more you have written, the stronger the voice match — Alex learns your sentence rhythm, vocabulary, and stylistic habits from your actual prose. Every suggestion appears as dismissible ghost text: press Tab to accept or Esc to discard.",
      },
    },
    {
      "@type": "Question",
      name: "What is the World Board feature in Xvault Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The World Board is an automatic knowledge graph of your story's universe. As you write, Xvault Studio extracts every character, location, and faction from your manuscript and maps their relationships visually. You never need to maintain a separate spreadsheet or character bible — the World Board builds itself and stays current as your story evolves.",
      },
    },
    {
      "@type": "Question",
      name: "How does Xvault Studio track plot threads and find dead branches?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "The Story Bible tracks every plot thread introduced in your manuscript — mysteries planted, promises made to the reader, unresolved confrontations. When a thread is introduced but never followed up, Xvault flags it as a dead branch. For long-form fiction writers working across many chapters, this prevents the common problem of forgotten subplots reaching a final draft unresolved.",
      },
    },
    {
      "@type": "Question",
      name: "Can I export my manuscript from Xvault Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. You can export your manuscript as a Word document (.docx) from the studio sidebar at any time. EPUB and PDF export formats are in development and will be available at full launch. Your manuscript is always yours — Xvault Studio does not lock you into the platform.",
      },
    },
    {
      "@type": "Question",
      name: "Is my manuscript safe when stored in Xvault Studio's cloud?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All manuscript data is encrypted in transit and at rest. Only you can access your projects — Xvault Studio does not share or sell your writing. Your manuscript is never used to train AI models. You can export your full manuscript or delete your account and all data at any time.",
      },
    },
    {
      "@type": "Question",
      name: "Do I need to install software to use Xvault Studio?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No installation is required. Xvault Studio runs entirely in your web browser — Chrome, Firefox, Safari, and Edge are all supported. Your work auto-saves to the cloud every two seconds, so you can switch devices mid-session without losing anything.",
      },
    },
  ],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <Navbar />
      <main>
        <Hero />
        <WhyXvault />
        <Features />
        <HowItWorks />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
