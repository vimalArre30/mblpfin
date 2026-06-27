import Hero from "@/components/home/Hero";
import HowItWorks from "@/components/home/HowItWorks";
import WhyMBLPFin from "@/components/home/WhyMBLPFin";
import Features from "@/components/home/Features";
import Founder from "@/components/home/Founder";
import Community from "@/components/home/Community";
import CoBuild from "@/components/home/CoBuild";
import ComingSoon from "@/components/home/ComingSoon";
import AndroidDownload from "@/components/home/AndroidDownload";
import PricingPreview from "@/components/home/PricingPreview";
import BlogPreview from "@/components/home/BlogPreview";
import FAQ from "@/components/home/FAQ";
import HomePhilosophy from "@/components/home/HomePhilosophy";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <HowItWorks />
      <WhyMBLPFin />
      <Features />
      <Founder />
      <Community />
      <CoBuild />
      <ComingSoon />
      <AndroidDownload />
      <PricingPreview />
      <BlogPreview />
      <FAQ />
      <HomePhilosophy />
    </main>
  );
}
