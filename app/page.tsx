import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import ComparisonSection from "@/components/landing/ComparisonSection";
import EcosystemSection from "@/components/landing/EcosystemSection";
import FounderSection from "@/components/landing/FounderSection";
import Pricing from "@/components/landing/Pricing";
import CtaSection from "@/components/landing/CtaSection";
import ProblemSection from "@/components/landing/ProblemSection";
import Footer from "@/components/landing/Footer";
export default function Home() {
  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-black font-sans">
      <Navbar />
      <main className="flex flex-1 flex-col w-full">
        <Hero />
        <ProblemSection />
        <HowItWorks />
        <ComparisonSection />
        <EcosystemSection />
        <FounderSection />
        <Pricing />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
