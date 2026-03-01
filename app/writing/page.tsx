import type { Metadata } from "next";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import BlogListing from "@/components/sections/BlogListing";
import { getAllPosts, getAllCategories } from "@/lib/blog";
import { BRAND } from "@/lib/constants";

// ---------------------------------------------------------------------------
// SEO Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: "Writing | Mr. Bottom Line",
  description: "Long reads on money, time, and decisions that compound.",
  metadataBase: new URL(BRAND.url),
  alternates: {
    canonical: `${BRAND.url}/writing`,
  },
  openGraph: {
    title: "Writing | Mr. Bottom Line",
    description: "Long reads on money, time, and decisions that compound.",
    url: `${BRAND.url}/writing`,
    siteName: BRAND.name,
    type: "website",
    images: [
      {
        url: "https://www.mrbottomline.club/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mr. Bottom Line — Writing",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Writing | Mr. Bottom Line",
    description: "Long reads on money, time, and decisions that compound.",
    images: ["https://www.mrbottomline.club/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

// ---------------------------------------------------------------------------
// Page (Server Component)
// Fetches all published posts server-side and passes them to the client
// component that handles category filtering.
// ---------------------------------------------------------------------------

export default function WritingPage() {
  const posts = getAllPosts();
  const categories = getAllCategories();

  return (
    <>
      <Navbar />
      <main>
        <BlogListing posts={posts} categories={categories} />
      </main>
      <Footer />
    </>
  );
}
