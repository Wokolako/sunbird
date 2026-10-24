import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border, 38 20% 88%))",
        input: "hsl(var(--input, 38 20% 85%))",
        ring: "hsl(var(--ring, 38 60% 50%))",
        background: "hsl(var(--background, 40 33% 98%))", // #FAF8F5 warm alabaster
        foreground: "hsl(var(--foreground, 30 10% 12%))", // #1E1C1A deep charcoal
        primary: {
          DEFAULT: "hsl(var(--primary, 30 10% 12%))", // Deep Obsidian luxury
          foreground: "hsl(var(--primary-foreground, 40 33% 98%))",
          50: "#FAF7F2",
          100: "#F3EDE2",
          200: "#E6D7C3",
          300: "#D6BFA0",
          400: "#C5A880",
          500: "#B39164",
          600: "#8C6D3B", // Royal Champagne Gold
          700: "#6B522B",
          800: "#4D3B1E",
          900: "#2B2111",
          950: "#140F08",
        },
        gold: {
          DEFAULT: "#D4AF37",
          light: "#F3E5AB",
          dark: "#997A15",
          champagne: "#C5A880",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary, 38 30% 94%))",
          foreground: "hsl(var(--secondary-foreground, 30 10% 12%))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive, 0 72% 51%))",
          foreground: "hsl(var(--destructive-foreground, 0 0% 98%))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted, 38 20% 94%))",
          foreground: "hsl(var(--muted-foreground, 30 6% 45%))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent, 38 60% 50%))", // #D4AF37 / #C5A880 warm gold
          foreground: "hsl(var(--accent-foreground, 0 0% 100%))",
        },
        card: {
          DEFAULT: "hsl(var(--card, 0 0% 100%))",
          foreground: "hsl(var(--card-foreground, 30 10% 12%))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover, 0 0% 100%))",
          foreground: "hsl(var(--popover-foreground, 30 10% 12%))",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        serif: [
          "Playfair Display",
          "Cormorant Garamond",
          "Georgia",
          "Cambria",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "Plus Jakarta Sans",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      fontSize: {
        "2xs": ["0.75rem", { lineHeight: "1.125rem" }],   // 12px — smallest allowed
        xs:    ["0.8125rem", { lineHeight: "1.25rem" }],   // 13px (was 12px)
        sm:    ["0.9375rem", { lineHeight: "1.375rem" }],  // 15px (was 14px)
        base:  ["1.0625rem", { lineHeight: "1.625rem" }],  // 17px (was 16px)
        lg:    ["1.1875rem", { lineHeight: "1.75rem" }],   // 19px (was 18px)
        xl:    ["1.3125rem", { lineHeight: "1.875rem" }],  // 21px (was 20px)
        "2xl": ["1.5625rem", { lineHeight: "2rem" }],      // 25px (was 24px)
        "3xl": ["1.9375rem", { lineHeight: "2.375rem" }],  // 31px (was 30px)
        "4xl": ["2.3125rem", { lineHeight: "2.625rem" }],  // 37px (was 36px)
        "5xl": ["3.0625rem", { lineHeight: "1" }],         // 49px (was 48px)
        "6xl": ["3.8125rem", { lineHeight: "1" }],         // 61px (was 60px)
      },
    },
  },
  plugins: [],
};

export default config;
