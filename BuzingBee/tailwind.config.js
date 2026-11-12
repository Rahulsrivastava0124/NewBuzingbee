/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // site palette; theme-aware ones read the CSS variables in globals.css (light/dark)
        honey: "#fdb905",
        violet: "#6d3df2",
        ink: "rgb(var(--ink) / <alpha-value>)",
        slate: "rgb(var(--slate) / <alpha-value>)",
        paper: "rgb(var(--paper) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        comb: "rgb(var(--comb) / <alpha-value>)",
        // older names used across inner pages, pointed at the same tokens
        bgPrimary: "rgb(var(--paper) / <alpha-value>)",
        card: "rgb(var(--surface) / <alpha-value>)",
        bgSection: "rgb(var(--comb) / <alpha-value>)",
        accent: "#fdb905",
        accentHover: "#f5ad00",
        textHeading: "rgb(var(--ink) / <alpha-value>)",
        textBody: "rgb(var(--body) / <alpha-value>)",
        textMuted: "rgb(var(--slate) / <alpha-value>)",
        border: "rgb(var(--line) / <alpha-value>)",
        borderHover: "#fdb905",
      },
      fontFamily: {
        heading: ["var(--font-sans)"],
        body: ["var(--font-sans)"],
        jakarta: ["var(--font-sans)"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "class" })],
};
