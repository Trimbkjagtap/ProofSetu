import type { Config } from "tailwindcss";

/**
 * ProofSetu design tokens — warm editorial palette (plum / berry / clay /
 * apricot / gold). Legacy names (navy, forest, indigo, emerald, teal, citation,
 * sage, softblue, ivory) are remapped so existing components restyle in place.
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
        plum: { DEFAULT: "#292038", dark: "#1E1729" },
        berry: "#623B55",
        clay: "#A6534F",
        apricot: "#D77A57",
        gold: "#E7B66B",
        cream: "#FFF9F2",
        blush: "#F8EEE9",
        // Legacy aliases → new palette
        navy: { DEFAULT: "#292038", dark: "#1E1729" },
        forest: { DEFAULT: "#292038", dark: "#1E1729" },
        indigo: "#A6534F", // → clay accent
        emerald: "#A6534F", // → clay
        teal: "#2E7D6E", // → muted teal (Confirmed)
        citation: "#623B55", // → muted plum (citations)
        sage: "#F8EEE9", // → blush fill
        softblue: "#F8EEE9",
        ivory: "#FFF9F2",
        paper: "#FFFFFF",
        ink: "#27232B",
        muted: "#6F6873",
        line: "#DDD1CB",
        success: "#2E7D6E", // muted teal
        danger: "#BE3B39", // red (expired / errors)
        warning: "#D97706", // amber (corrected / attention)
      },
      backgroundImage: {
        "app-gradient":
          "linear-gradient(145deg, #FFFDF9 0%, #FFF8F2 52%, #F5EFF4 100%)",
        "primary-gradient":
          "linear-gradient(118deg, #292038 0%, #623B55 48%, #D77A57 100%)",
        "panel-gradient":
          "linear-gradient(135deg, #FFFFFF 0%, #FFF7F2 60%, #F8EEE9 100%)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "ui-serif", "Georgia", "serif"],
      },
      borderRadius: {
        card: "16px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(41, 32, 56, 0.04), 0 8px 20px rgba(41, 32, 56, 0.06)",
        raised: "0 14px 34px rgba(41, 32, 56, 0.14)",
        clay: "0 10px 26px rgba(166, 83, 79, 0.30)",
      },
      keyframes: {
        "tab-slide": {
          from: { opacity: "0.5", transform: "translateX(14px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-right": {
          from: { transform: "translateX(100%)" },
          to: { transform: "translateX(0)" },
        },
        wave: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%": { transform: "rotate(-12deg)" },
          "40%": { transform: "rotate(10deg)" },
          "60%": { transform: "rotate(-6deg)" },
          "80%": { transform: "rotate(4deg)" },
        },
      },
      animation: {
        "tab-slide": "tab-slide 200ms ease-out",
        "slide-in-right": "slide-in-right 220ms ease-out",
        wave: "wave 900ms ease-in-out 1",
      },
      maxWidth: {
        prose: "68ch",
        shell: "1200px",
        title: "760px",
      },
    },
  },
  plugins: [],
};

export default config;
