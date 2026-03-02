import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.4s ease-out forwards",
      },
      colors: {
        coffee: {
          50: "#FDF8F0",
          100: "#F5E6D3",
          200: "#D4A574",
          300: "#B8865A",
          400: "#8B6914",
          500: "#6F4E37",
          600: "#5C3D2E",
          700: "#4A2C20",
          800: "#3A1F15",
          900: "#2C1810",
        },
      },
    },
  },
  plugins: [],
};
export default config;
