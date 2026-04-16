import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: "#f5f7fb",
        ink: "#101828",
        muted: "#667085",
        border: "#d0d5dd",
        lane: "#ffffff",
        track: "#d1fadf",
        progress: "#fef0c7",
        overdue: "#fee4e2",
      },
      boxShadow: {
        panel: "0 18px 45px rgba(15, 23, 42, 0.08)",
        card: "0 10px 30px rgba(15, 23, 42, 0.08)",
      },
      fontFamily: {
        sans: ["Segoe UI", "Helvetica Neue", "Arial", "ui-sans-serif", "sans-serif"],
      },
      backgroundImage: {
        grid: "radial-gradient(circle at 1px 1px, rgba(15, 23, 42, 0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
};

export default config;
