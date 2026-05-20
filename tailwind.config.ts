import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Existing brand teal — kept for continuity. Horizon-spirit
        // accents added below for the dashboard glow-up.
        brand: {
          50:  "#eef6f5",
          100: "#d6e9e7",
          200: "#a9d2cd",
          500: "#2f8f86",
          600: "#266f68",
          700: "#1f5853",
        },
        // Soft accents inspired by Horizon UI's pastel stat-card system.
        accent: {
          indigo: { 50: "#eef2ff", 500: "#6366f1", 600: "#4f46e5" },
          violet: { 50: "#f5f3ff", 500: "#8b5cf6", 600: "#7c3aed" },
          cyan:   { 50: "#ecfeff", 500: "#06b6d4", 600: "#0891b2" },
          amber:  { 50: "#fffbeb", 500: "#f59e0b", 600: "#d97706" },
          rose:   { 50: "#fff1f2", 500: "#f43f5e", 600: "#e11d48" },
        },
      },
      boxShadow: {
        // Soft floating-card shadow used by Horizon-style dashboards.
        soft: "0 4px 20px -2px rgba(15, 23, 42, 0.06)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
