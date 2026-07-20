import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const repoRoot = resolve(__dirname, "..");

export default defineConfig({
  root: __dirname,
  envDir: repoRoot,
  plugins: [react()],
  resolve: {
    alias: {
      "@shared": resolve(repoRoot, "src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "index.html"),
    },
  },
});
