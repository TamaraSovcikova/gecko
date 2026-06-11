/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        purple: {
          50:  "#faf9fd",
          100: "#f4f1fb",
          200: "#ede8f8",
          300: "#c9bde8",
          400: "#b8a4e8",
          500: "#8b6fd4",
          600: "#5c3fa3",
          700: "#4e358f",
        },
        gold: {
          DEFAULT: "#f0b429",
          deep:    "#d4940e",
        },
      },
      fontFamily: {
        base:    ["Manrope", "Segoe UI", "Arial", "sans-serif"],
        display: ["Sora", "Manrope", "Segoe UI", "Arial", "sans-serif"],
      },
      boxShadow: {
        sm:     "0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        md:     "0 4px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
        lg:     "0 8px 24px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.05)",
        xl:     "0 16px 40px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.06)",
        nav:    "0 1px 3px rgba(0,0,0,0.08)",
        button: "0 4px 14px rgba(92, 63, 163, 0.28)",
        pop:    "0 20px 40px rgba(0,0,0,0.12)",
      },
      borderRadius: {
        DEFAULT: "8px",
        md:      "14px",
        lg:      "20px",
        pill:    "999px",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(-16px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to:   { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0.5" },
        },
      },
      animation: {
        "fade-in":  "fade-in 0.3s ease-out forwards",
        "slide-in": "slide-in 0.3s ease-out forwards",
        "scale-in": "scale-in 0.25s ease-out forwards",
        shimmer:    "shimmer 1.5s ease-in-out infinite",
      },
    },
  },
  plugins: [
    require("@tailwindcss/forms"),
    require("tailwindcss-animate"),
  ],
};
