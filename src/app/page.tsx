import Navbar      from "@/components/landing/Navbar";
import Hero        from "@/components/landing/Hero";
import WhyXvault   from "@/components/landing/WhyXvault";
import Features    from "@/components/landing/Features";
import HowItWorks  from "@/components/landing/HowItWorks";
import FAQ         from "@/components/landing/FAQ";
import CTA         from "@/components/landing/CTA";
import Footer      from "@/components/landing/Footer";

export default function HomePage() {
  return (
    <>
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
