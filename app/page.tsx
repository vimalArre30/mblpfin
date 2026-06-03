import Link from "next/link";
import Hero from "@/components/sections/Hero";
import NarrativeArc from "@/components/sections/NarrativeArc";
import ThreePillars from "@/components/sections/ThreePillars";
import YouTubeFeature from "@/components/sections/YouTubeFeature";
import Philosophy from "@/components/sections/Philosophy";
import Thinking from "@/components/sections/Thinking";
import YouTubeSeries from "@/components/sections/YouTubeSeries";
import ToolsWidget from "@/components/sections/ToolsWidget";
import Collaborate from "@/components/sections/Collaborate";
import CommunityWaitlist from "@/components/sections/CommunityWaitlist";

// Navbar + Footer are rendered globally by app/layout.tsx. Don't re-render
// them here or any other page — that would produce a double shell.
export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <NarrativeArc />
        <ThreePillars />
        <YouTubeFeature />
        <Philosophy />
        <Thinking />
        <ToolsWidget />
        <YouTubeSeries />
        <Collaborate />
        <CommunityWaitlist />
      </main>

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
