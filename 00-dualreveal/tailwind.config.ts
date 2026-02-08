import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        mint: {
          50: "#f6fbf7",
          100: "#e3f3ea",
          200: "#c5e6d6",
          300: "#9ed4bb",
          400: "#72b99a",
          500: "#4a9c7c",
          600: "#2f7f62",
          700: "#24614c",
          800: "#1f4c3d",
          900: "#17382d"
        },
        navy: "#1b2533",
        blush: "#f7b8a5",
        sand: "#f5efe7"
      },
      boxShadow: {
        soft: "0 20px 40px -24px rgba(15, 25, 38, 0.45)",
        lift: "0 18px 28px -16px rgba(30, 50, 70, 0.45)"
      },
      borderRadius: {
        xl: "1.5rem"
      }
    }
  },
  plugins: []
};

export default config;
