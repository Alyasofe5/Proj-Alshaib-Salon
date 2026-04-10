import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  publicDir: "public",
  server: {
    open: "/index.html"
  },
  build: {
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Increase chunk warning limit (large admin pages are acceptable)
    chunkSizeWarningLimit: 600,
    // CSS code splitting per chunk
    cssCodeSplit: true,
    // Source maps off in production
    sourcemap: false,
    rollupOptions: {
      input: {
        react: resolve(__dirname, "index.html")
      },
      output: {
        // Manual chunk splitting — vendor libs separate from app code
        manualChunks(id) {
          // React runtime — smallest, most cached
          if (id.includes("node_modules/react/") || id.includes("node_modules/react-dom/") || id.includes("node_modules/scheduler/")) {
            return "vendor-react";
          }
          // React Router
          if (id.includes("node_modules/react-router")) {
            return "vendor-react";
          }
          // Supabase — large, changes rarely
          if (id.includes("node_modules/@supabase") || id.includes("node_modules/ws/") || id.includes("node_modules/isows/")) {
            return "vendor-supabase";
          }
          // PDF/canvas libs — only used in admin, heavy
          if (id.includes("node_modules/html2canvas") || id.includes("node_modules/jspdf")) {
            return "vendor-pdf";
          }
          // Icons
          if (id.includes("node_modules/lucide-react")) {
            return "vendor-icons";
          }
        },
        // Consistent hashed filenames for long-term caching
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      }
    },
    // Minify with esbuild (faster + smaller)
    minify: "esbuild",
    // esbuild minify options — drop console.log in production
    esbuildOptions: {
      drop: ["console", "debugger"],
      legalComments: "none",
    },
  }
});
