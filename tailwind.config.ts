import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#090d16",
        surface: "#0f172a",
        card: "#131c31",
        "card-hover": "#17233d",
        border: "#1e293b",
        "border-glow": "#38bdf8",
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          950: "#083344",
        },
        emerald: {
          400: "#34d399",
          500: "#10b981",
          950: "#064e3b",
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Menlo", "Consolas", "Courier New", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(6, 182, 212, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(6, 182, 212, 0.6)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
