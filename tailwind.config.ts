import containerQueries from "@tailwindcss/container-queries";
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // Clases definidas en la lógica (p. ej. colores de avatar de los profesionales).
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Verde de SANMAR SALUD (cartel del consultorio), en lugar del turquesa genérico.
        brand: {
          50: "#f1f6ee",
          100: "#dfecd8",
          200: "#c0dab4",
          300: "#98c287",
          400: "#6aa45a",
          500: "#468a3c",
          600: "#356f2f",
          700: "#2b5a27",
          800: "#244a22",
          900: "#1e3d1d",
          950: "#0f230f",
        },
        // Neutros cálidos (papel, no gris azulado): reemplazan a slate en toda la app.
        slate: {
          50: "#f8f7f3",
          100: "#f1efe9",
          200: "#e3e0d7",
          300: "#cfcabe",
          400: "#a19c90",
          500: "#706c63",
          600: "#5a574f",
          700: "#46443e",
          800: "#2f2e2a",
          900: "#1f1e1b",
          950: "#121210",
        },
        surface: {
          DEFAULT: "#fffefb",
          muted: "#f6f5f0",
          subtle: "#efede6",
        },
        ink: {
          DEFAULT: "#1f1e1b",
          muted: "#6b675f",
          subtle: "#9a958a",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(31, 30, 27, 0.05), 0 4px 12px -4px rgba(31, 30, 27, 0.07)",
        card: "0 1px 2px rgba(31, 30, 27, 0.04), 0 6px 18px -10px rgba(31, 30, 27, 0.12)",
        elevated:
          "0 2px 4px -1px rgba(31, 30, 27, 0.06), 0 14px 32px -12px rgba(31, 30, 27, 0.16)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "var(--radius-xl)",
        "2xl": "var(--radius-2xl)",
        "3xl": "var(--radius-3xl)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
    },
  },
  // import en lugar de require(): Node 24 carga este .ts como ES module.
  plugins: [animate, containerQueries],
};

export default config;
