import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./data/**/*.{ts,tsx,json}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: ["class"],
  theme: {
    extend: {
      colors: {
        brand: {
          cream: "#F6F8F0",
          red: "#2F7D32",
          yellow: "#C9E21A",
          green: "#4E4C4D",
          ink: "#2F3330",
          sand: "#E7F0CB",
        },
      },
      fontFamily: {
        heading: ["var(--font-comfortaa)", "sans-serif"],
        body: ["var(--font-comfortaa)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(47, 51, 48, 0.10)",
        float: "0 20px 70px rgba(47, 125, 50, 0.16)",
      },
      backgroundImage: {
        "heritage-grid":
          "linear-gradient(rgba(47,125,50,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(47,125,50,0.05) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
