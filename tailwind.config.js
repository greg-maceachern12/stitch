/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        surface: "var(--surface)",
        border: "var(--border)",
        foreground: "var(--foreground)",
        muted: "var(--muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        danger: "var(--danger)",
        "hover-surface": "var(--hover-surface)",
      },
      fontFamily: {
        sans: ["var(--font-open-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        serif: ["var(--font-lovato)", "Georgia", "serif"],
      },
      maxWidth: {
        content: "42rem",
        doc: "48rem",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 15, 15, 0.04), 0 0 0 1px rgba(15, 15, 15, 0.04)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
