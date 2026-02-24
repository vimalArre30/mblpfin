import type { Config } from "tailwindcss";

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
    },
  },
  plugins: [],
};

export default config;
