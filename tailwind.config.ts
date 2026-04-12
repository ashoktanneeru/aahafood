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
          cream: "#FFF8E7",
          red: "#8B0000",
          yellow: "#E6A817",
          green: "#2E7D32",
          ink: "#2B1E1A",
          sand: "#F5E7C8",
        },
      },
      fontFamily: {
        heading: ["var(--font-playfair)", "serif"],
        body: ["var(--font-inter)", "sans-serif"],
      },
      boxShadow: {
        soft: "0 18px 50px rgba(77, 39, 10, 0.10)",
        float: "0 20px 70px rgba(139, 0, 0, 0.18)",
      },
      backgroundImage: {
        "heritage-grid":
          "linear-gradient(rgba(139,0,0,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(139,0,0,0.04) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
};

export default config;
