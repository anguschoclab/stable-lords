import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { TanStackRouterVite } from "@tanstack/router-vite-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    TanStackRouterVite({
      autoCodeSplitting: true,
    }),
    react(),
    visualizer({
      filename: "stats.html",
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: mode === "development",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("recharts") || id.includes("framer-motion") || id.includes("lucide-react") || id.includes("lodash")) {
              return "vendor-ui";
            }
            if (id.includes("react") || id.includes("zustand") || id.includes("@tanstack")) {
              return "vendor-core";
            }
            if (id.includes("radix-ui") || id.includes("date-fns") || id.includes("cmdk")) {
              return "vendor-assets";
            }
            return "vendor";
          }
        },
      },
    },
  },
}));
