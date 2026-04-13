import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";
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
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "icons/*.png", "audio/*.mp3"],
      manifest: {
        name: "Stable Lords",
        short_name: "Stable Lords",
        description: "Manage your stable of warriors, train fighting styles, and compete in the arena.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0d0f14",
        theme_color: "#b8962e",
        categories: ["games"],
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,mp3}"],
        navigateFallback: "/index.html",
        clientsClaim: true,
        skipWaiting: true,
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MiB
      },
    }),
    visualizer({
      filename: "stats.html",
      brotliSize: true,
    }),
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 1024,
    }),
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 1024,
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
