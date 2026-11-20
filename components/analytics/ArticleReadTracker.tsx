"use client";

import { useEffect } from "react";
import { track } from "@/lib/analytics/track";

/**
 * Fires `article_read_complete` once when the reader has BOTH scrolled past
 * 90% of the page AND spent 30s+ on it — a real read, not a skim.
 */
export default function ArticleReadTracker({ slug }: { slug: string }) {
  useEffect(() => {
    let timeOk = false;
    let scrollOk = false;
    let fired = false;

    function maybeFire() {
      if (fired || !timeOk || !scrollOk) return;
      fired = true;
      track("article_read_complete", { article_slug: slug });
    }

    function onScroll() {
      const doc = document.documentElement;
      const scrolled = window.scrollY + window.innerHeight;
      if (scrolled / doc.scrollHeight >= 0.9) {
        scrollOk = true;
        maybeFire();
      }
    }

    const timer = setTimeout(() => {
      timeOk = true;
      maybeFire();
    }, 30_000);

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, [slug]);

  return null;
}
