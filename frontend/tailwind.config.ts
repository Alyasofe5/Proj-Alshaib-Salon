import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core Brand Palette — Charcoal + Amber Gold
        "bg-dark":        "#343434",   // Main background
        "card-dark":      "#2D2D2D",   // Cards / elevated surfaces
        "surface-hover":  "#3A3A3A",   // Hover / tertiary surface
        "accent-gold":    "#E6B31E",   // Primary accent — amber gold
        "accent-hover":   "#FFD700",   // Gold hover (lighter)
        "accent-active":  "#C59C00",   // Gold active / pressed (darker)
        "text-cream":     "#FCFAF1",   // Primary text — warm cream
        "text-secondary": "#CACACA",   // Secondary text / inactive icons
        "text-muted":     "#8A8A8A",   // Muted / placeholder
        "cta-dark":       "#343434",   // CTA button text (dark on gold)
        "disabled-gray":  "#616161",   // Disabled elements

        // Semantic / Feedback
        success:  "#4CAF50",
        warning:  "#FFC107",
        error:    "#F44336",
        info:     "#2196F3",
      },
      fontFamily: {
        tajawal: ["Tajawal", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
