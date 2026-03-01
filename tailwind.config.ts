import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#1B2E5E",
        "navy-dark": "#0F1E40",
        ink: "#0D0D0D",
        body: "#333333",
        "surface-gray": "#F5F6F8",
        border: "#E0E4ED",
      },
      fontFamily: {
        playfair: ["var(--font-playfair)", "Georgia", "serif"],
        inter: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        content: "1100px",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      lineHeight: {
        relaxed: "1.7",
      },
      // ── Prose (article body) typography ─────────────────────────────────
      // Applied to blog post bodies via the `prose` class.
      // Overrides match the site's brand tokens so the reading experience
      // feels native, not like a third-party default.
      typography: {
        DEFAULT: {
          css: {
            color: "#333333",
            lineHeight: "1.85",
            // Headings — Playfair Display to match the rest of the site
            h1: { fontFamily: "var(--font-playfair), Georgia, serif", color: "#0D0D0D", lineHeight: "1.25" },
            h2: { fontFamily: "var(--font-playfair), Georgia, serif", color: "#0D0D0D", lineHeight: "1.3", marginTop: "2.5rem", marginBottom: "1rem" },
            h3: { fontFamily: "var(--font-playfair), Georgia, serif", color: "#0D0D0D", lineHeight: "1.35", marginTop: "2rem", marginBottom: "0.75rem" },
            h4: { fontFamily: "var(--font-playfair), Georgia, serif", color: "#0D0D0D" },
            // Links
            a: {
              color: "#1B2E5E",
              textDecoration: "underline",
              textDecorationColor: "#E0E4ED",
              fontWeight: "500",
              "&:hover": { color: "#0F1E40", textDecorationColor: "#1B2E5E" },
            },
            // Emphasis
            strong: { color: "#0D0D0D", fontWeight: "600" },
            // Blockquotes — left-border in navy, no italic, no smart-quote pseudo-elements
            blockquote: { borderLeftColor: "#1B2E5E", fontStyle: "normal", color: "#333333" },
            "blockquote p:first-of-type::before": { content: '""' },
            "blockquote p:last-of-type::after": { content: '""' },
            // Inline code — strip backtick wrapping, surface-gray pill
            "code::before": { content: '""' },
            "code::after": { content: '""' },
            code: { backgroundColor: "#F5F6F8", color: "#0D0D0D", borderRadius: "0.25rem", padding: "0.15em 0.4em", fontWeight: "400" },
            // Dividers
            hr: { borderColor: "#E0E4ED", marginTop: "2.5rem", marginBottom: "2.5rem" },
            // List markers in navy
            "ul > li::marker": { color: "#1B2E5E" },
            "ol > li::marker": { color: "#1B2E5E" },
          },
        },
      },
    },
  },
  plugins: [typography],
};

export default config;
