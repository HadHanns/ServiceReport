/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Manrope'", "'General Sans'", "ui-sans-serif", "system-ui"],
      },
      colors: {
        slateglass: {
          50: "#f5f6f8",
          100: "#e6e8ed",
        },
      },
      borderRadius: {
        "3xl": "1.75rem",
      },
      boxShadow: {
        card: "0px 18px 45px rgba(15, 23, 42, 0.07)",
      },
    },
  },
  plugins: [],
};
