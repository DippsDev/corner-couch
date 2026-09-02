import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    open: true,
    host: true,
  },
});
