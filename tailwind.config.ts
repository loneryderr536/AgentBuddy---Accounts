import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        gunmetal: {
          DEFAULT: "#28283c",
          light: "#363650",
          dark: "#1d1d2c",
        },
        cadet: {
          DEFAULT: "#b4b4c8",
          light: "#d4d4e2",
          dark: "#8e8ea8",
        },
        water: {
          DEFAULT: "#dcf0ff",
          light: "#eef8ff",
          dark: "#b8dfff",
        },
        palepink: {
          DEFAULT: "#ffdcdc",
          light: "#ffefef",
          dark: "#ffbaba",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
