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
        // Core Brand Palette — Charcoal Black + Electric Lime
        "bg-dark": "#222022",   // Main background — charcoal black
        "card-dark": "#2A282A",   // Cards / elevated surfaces
        "surface-hover": "#302E30",   // Hover / tertiary surface
        "accent-lime": "#C3D809",   // Primary accent — electric lime
        "accent-hover": "#D4EC0A",   // Lime hover (lighter)
        "accent-active": "#A8BB06",   // Lime active / pressed (darker)
        "text-white": "var(--color-text-primary)",   // Primary text
        "text-secondary": "#BBBBBB",   // Secondary text
        "text-muted": "#777777",   // Muted / placeholder
        "cta-dark": "var(--color-background)",   // Dark text on lime CTAs
        "disabled-gray": "var(--color-surface)",   // Disabled elements
        
        // Legacy compatibility aliases (Golden -> Lime)
        "accent-lime": "#C3D809",
        "gold-light": "#D4EC0A",
        "gold": "#C3D809",

        // Semantic / Feedback
        success: "#C3D809",
        warning: "#C3D809",
        error: "#F44336",
        info: "#2196F3",
      },
      fontFamily: {
        noto: ["var(--font-noto)", "system-ui", "sans-serif"],
      },
      screens: {
        'sm': '480px',    // Small phone → large phone
        'md': '768px',    // Tablet portrait (iPad Mini, iPad)
        'lg': '1024px',   // Tablet landscape / small laptop
        'xl': '1280px',   // Desktop
        '2xl': '1536px',  // Large desktop
      },
    },
  },
  plugins: [],
};
export default config;
