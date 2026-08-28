import tailwindRtl from "tailwindcss-rtl";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#F8FAFC", // خلفية الموقع
        surface: "#FFFFFF", // الكروت

        primary: "#111827", // اللون الأساسي
        "primary-hover": "#374151",

        accent: "#F5A623", // لون مميز (نفس لون اللوجو البرتقالي)
        "accent-hover": "#D9890F",

        dark: "#111827", // النص الأساسي
        grayText: "#6B7280", // النص الثانوي
        border: "#E5E7EB", // الحدود

        success: "#22C55E",
        danger: "#EF4444",
      },

      fontFamily: {
        sans: ["Cairo", "Inter", "sans-serif"],
      },
    },
  },
  plugins: [tailwindRtl],
};
