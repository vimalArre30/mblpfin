import Navbar from "@/components/sections/Navbar";
import Hero from "@/components/sections/Hero";
import NarrativeArc from "@/components/sections/NarrativeArc";
import Pursuits from "@/components/sections/Pursuits";
import YouTubeFeature from "@/components/sections/YouTubeFeature";
import Philosophy from "@/components/sections/Philosophy";
import Thinking from "@/components/sections/Thinking";
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
        <Pursuits />
        <YouTubeFeature />
        <Philosophy />
        <Thinking />
        <Collaborate />
        <CommunityWaitlist />
      </main>
      <Footer />
    </>
  );
}
