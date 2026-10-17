import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Long-lived vendor chunks cache well across deployments.
        // React, MUI, Emotion and their shared helpers must share one chunk:
        // split apart, they import each other in a cycle and the app crashes
        // on load ("Cannot set properties of undefined (setting 'Activity')").
        // Charts and the editor only depend on that chunk, never the reverse.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (/[\\/]node_modules[\\/](recharts|victory-vendor|d3-[^\\/]+)[\\/]/.test(id)) return "charts";
          if (/[\\/]node_modules[\\/](react-quill-new|quill|parchment|quill-delta)[\\/]/.test(id)) return "editor";
          return "vendor";
        },
      },
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
});
