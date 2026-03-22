/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{html,js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgPrimary: "#fffdf5",
        card: "#ffffff",
        bgSection: "#fff7d6",
        accent: "#ecad10",
        accentHover: "#a97300",
        textHeading: "#1f1b12",
        textBody: "#3f3a2d",
        textMuted: "#7a725f",
        border: "#f1e2a8",
        borderHover: "#eab308",
      },
      fontFamily: {
        heading: ["var(--font-syne)", "system-ui", "sans-serif"],
        body: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "14px",
      },
    },
  },
  plugins: [require("@tailwindcss/forms")({ strategy: "class" })],
};
