import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef6f5",
          100: "#d6e9e7",
          500: "#2f8f86",
          600: "#266f68",
          700: "#1f5853",
        },
      },
    },
  },
  plugins: [],
};

export default config;
