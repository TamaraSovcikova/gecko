// vite.config.ts - Vite build tool configuration.
// @vitejs/plugin-react enables Fast Refresh during development.
// server.port pins the dev server to 5173 so the backend CORS config always matches.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
