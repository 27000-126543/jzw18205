/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        forest: {
          50: "#f0f7f4",
          100: "#daede3",
          200: "#b6dac7",
          300: "#85c0a3",
          400: "#52b788",
          500: "#2d6a4f",
          600: "#1b4332",
          700: "#143628",
          800: "#0f2a20",
          900: "#0a1f18",
        },
        amber: {
          50: "#fdf8f3",
          100: "#f9eddc",
          200: "#f2d8b7",
          300: "#e9bc87",
          400: "#d4a373",
          500: "#c98d55",
          600: "#b87445",
          700: "#995b3a",
          800: "#7c4a34",
          900: "#653e2d",
        },
        ivory: {
          50: "#fffef9",
          100: "#fefaf0",
          200: "#fdf5e0",
          300: "#fbf0cd",
          400: "#faf0c8",
          500: "#fefaE0",
        },
        slate: {
          850: "#264653",
        },
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Lora", "serif"],
      },
      animation: {
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.8s ease-out forwards",
        "pulse-soft": "pulseSoft 3s ease-in-out infinite",
        "count-up": "countUp 1.5s ease-out forwards",
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.85", transform: "scale(1.02)" },
        },
      },
      boxShadow: {
        card: "0 4px 20px -4px rgba(27, 67, 50, 0.12)",
        "card-hover": "0 8px 30px -6px rgba(27, 67, 50, 0.2)",
      },
    },
  },
  plugins: [],
};
