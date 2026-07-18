import type { Config } from "tailwindcss";

/**
 * ProofSetu design tokens — warm, sophisticated public-service palette.
 * Red (`danger`) is reserved strictly for errors and expired documents.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#123F35", // deep forest green — primary
          dark: "#0E332B", // darker evergreen — hover / headings
        },
        emerald: "#1F6B55", // emerald green — gradient partner / accents
        sage: "#DCE9E1", // soft sage — subtle fills
        cream: "#FAF7F0", // warm cream
        ivory: "#FAF7F0", // alias kept for existing usage
        paper: "#FFFFFF", // white surfaces
        terracotta: "#C65D3A", // muted accent (non-status)
        citation: "#315F7D", // citation blue — references / evidence
        ink: "#16241E", // main text
        muted: "#55635B", // secondary text
        line: "#CBDBD0", // thin sage border
        danger: "#B42318", // error / expired ONLY
        warning: "#9A6700", // warning / expiring
      },
      backgroundImage: {
        "app-gradient":
          "linear-gradient(135deg, #FAF7F0 0%, #F2F7F3 55%, #E7F1EB 100%)",
        "primary-gradient":
          "linear-gradient(135deg, #123F35 0%, #1F6B55 100%)",
        "panel-gradient": "linear-gradient(135deg, #FFFFFF 0%, #EEF6F1 100%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        card: "18px",
      },
      boxShadow: {
        // Soft, realistic elevation in the forest-green tint.
        card: "0 1px 2px rgba(18, 63, 53, 0.04), 0 6px 16px rgba(18, 63, 53, 0.06)",
        raised: "0 12px 30px rgba(18, 63, 53, 0.13)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
