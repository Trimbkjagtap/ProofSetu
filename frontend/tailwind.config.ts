import type { Config } from "tailwindcss";

/**
 * ProofSetu civic-service design tokens.
 * Colors map to the approved palette. Red (`error`) is reserved strictly for
 * errors, expired documents, and destructive actions.
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
          DEFAULT: "#174A3A", // deep forest green — primary
          dark: "#0F352A", // dark evergreen — hover / headings
        },
        ivory: "#F7F4EC", // warm ivory background
        paper: "#FFFDF8", // paper white — surfaces
        sage: "#DCE8DF", // soft sage — subtle fills
        terracotta: "#C65D3A", // muted terracotta accent (non-status)
        citation: "#315F7D", // citation blue
        ink: "#17211B", // main text
        muted: "#56635C", // secondary text
        line: "#CDD8D0", // borders
        danger: "#B42318", // error / expired / destructive ONLY
        warning: "#9A6700", // warning / expiring
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        card: "10px",
      },
      boxShadow: {
        // restrained, paper-like elevation
        card: "0 1px 2px rgba(15, 53, 42, 0.06), 0 1px 3px rgba(15, 53, 42, 0.04)",
        raised: "0 4px 12px rgba(15, 53, 42, 0.10)",
      },
      maxWidth: {
        prose: "68ch",
      },
    },
  },
  plugins: [],
};

export default config;
