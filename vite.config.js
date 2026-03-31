import { resolve } from "node:path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    open: "/index.html"
  },
  build: {
    rollupOptions: {
      input: {
        react: resolve(__dirname, "index.html")
      }
    }
  }
});
