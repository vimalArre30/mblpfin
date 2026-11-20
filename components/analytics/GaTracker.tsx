"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { track } from "@/lib/analytics/track";

/**
 * Declarative GA4 tracking so server components don't need to become client
 * components just to fire an event.
 *
 *  Clicks:   <a data-ga="cta_click" data-ga-cta-name="x" data-ga-cta-location="hero">
 *            → event `cta_click` with params { cta_name: "x", cta_location: "hero" }
 *            (data-ga-foo-bar → param foo_bar)
 *
 *  Hovers:   <div data-ga-hover="chart_hover" data-ga-chart-type="x"> → `chart_hover`
 *            { chart_type: "x" }, once per element per page view
 *
 *  Sections: <section data-ga-section="how_it_works">
 *            → `section_view` { section_name } once per page view at 50% visible
 *
 *  Articles: <div data-ga-article="my-slug"> — any link inside it to /tracker
 *            or /pro fires `cta_click` { cta_location:"article", article_slug }
 */

function toParamName(datasetKey: string): string {
  return datasetKey
    .slice(2) // drop the leading "ga"
    .replace(/^[A-Z]/, (c) => c.toLowerCase())
    .replace(/[A-Z]/g, (c) => "_" + c.toLowerCase());
}

export default function GaTracker() {
  const pathname = usePathname();

  // ── Click tracking (one delegated listener for the whole app) ──────────
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as Element | null;
      if (!target || !target.closest) return;

      const el = target.closest<HTMLElement>("[data-ga]");
      if (el) {
        const event = el.dataset.ga;
        if (event) {
          const params: Record<string, string> = {};
          for (const [key, value] of Object.entries(el.dataset)) {
            if (key === "ga" || key === "gaSection" || key === "gaArticle") continue;
            if (key.startsWith("ga") && value !== undefined) {
              params[toParamName(key)] = value;
            }
          }
          track(event, params);
        }
        return;
      }

      // In-article links to the product → content→product attribution
      const anchor = target.closest<HTMLAnchorElement>("a[href]");
      const article = anchor?.closest<HTMLElement>("[data-ga-article]");
      if (anchor && article) {
        let path = "";
        try {
          path = new URL(anchor.href, window.location.origin).pathname;
        } catch {
          return;
        }
        if (path.startsWith("/tracker") || path.startsWith("/pro")) {
          track("cta_click", {
            cta_name: path,
            cta_location: "article",
            article_slug: article.dataset.gaArticle,
          });
        }
      }
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // ── Hover tracking (once per element per page view) ────────────────────
  useEffect(() => {
    const seen = new WeakSet<Element>();
    function onOver(e: MouseEvent) {
      const target = e.target as Element | null;
      const el = target?.closest?.<HTMLElement>("[data-ga-hover]");
      if (!el || seen.has(el)) return;
      seen.add(el);
      const params: Record<string, string> = {};
      for (const [key, value] of Object.entries(el.dataset)) {
        if (key === "gaHover" || !key.startsWith("ga") || value === undefined) continue;
        params[toParamName(key)] = value;
      }
      track(el.dataset.gaHover as string, params);
    }
    document.addEventListener("mouseover", onOver, true);
    return () => document.removeEventListener("mouseover", onOver, true);
  }, [pathname]);

  // ── Section views (IntersectionObserver, once per section per page view) ─
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const seen = new Set<string>();
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const name = (entry.target as HTMLElement).dataset.gaSection;
          if (name && !seen.has(name)) {
            seen.add(name);
            track("section_view", { section_name: name });
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.5 }
    );
    // Let the new route's DOM mount before looking for sections.
    const t = setTimeout(() => {
      document
        .querySelectorAll<HTMLElement>("[data-ga-section]")
        .forEach((el) => io.observe(el));
    }, 300);
    return () => {
      clearTimeout(t);
      io.disconnect();
    };
  }, [pathname]);

  return null;
}
