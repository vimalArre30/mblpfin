import Link from "next/link";
import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import NarrativeArc from "@/components/sections/NarrativeArc";
import ThreePillars from "@/components/sections/ThreePillars";
import YouTubeFeature from "@/components/sections/YouTubeFeature";
import Philosophy from "@/components/sections/Philosophy";
import Thinking from "@/components/sections/Thinking";
import YouTubeSeries from "@/components/sections/YouTubeSeries";
import Collaborate from "@/components/sections/Collaborate";
import CommunityWaitlist from "@/components/sections/CommunityWaitlist";
import Footer from "@/components/sections/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <NarrativeArc />
        <ThreePillars />
        <YouTubeFeature />
        <Philosophy />
        <Thinking />
        <YouTubeSeries />
        <Collaborate />
        <CommunityWaitlist />
      </main>
      <Footer />

      {/* Tracker CTA — floating pill, fixed bottom-right */}
      <Link
        href="/tracker"
        className="fixed bottom-6 right-6 z-50 inline-flex items-center gap-2 bg-amber-400 text-navy-dark font-bold text-sm px-5 py-3 rounded-full shadow-xl hover:bg-amber-300 active:scale-95 transition-all duration-150"
      >
        Track My Expenses →
      </Link>
    </>
  );
}
