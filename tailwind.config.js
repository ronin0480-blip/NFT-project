/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#16211A",       // deep botanical ink background
        paper: "#EFE9DC",     // aged specimen-card paper
        bloom: "#E85A4F",     // coral accent, drawn from the artwork
        ochre: "#C99B3F",     // secondary accent
        moss: "#7A8C6B",      // muted success / line color
        line: "#3A4A3C",      // hairline dividers on ink background
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        sans: ["var(--font-grotesk)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      maxWidth: {
        content: "72rem",
      },
    },
  },
  plugins: [],
};
