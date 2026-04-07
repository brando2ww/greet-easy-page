import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
      { find: "react/jsx-runtime", replacement: path.resolve(__dirname, "./node_modules/react/jsx-runtime.js") },
      { find: "react/jsx-dev-runtime", replacement: path.resolve(__dirname, "./node_modules/react/jsx-dev-runtime.js") },
      { find: "react-dom/client", replacement: path.resolve(__dirname, "./node_modules/react-dom/client.js") },
      { find: /^react-dom$/, replacement: path.resolve(__dirname, "./node_modules/react-dom/index.js") },
      { find: /^react$/, replacement: path.resolve(__dirname, "./node_modules/react/index.js") },
    ],
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom",
      "react-dom/client",
      "@tanstack/react-query",
      "react-i18next",
      "i18next",
      "react-router-dom",
    ],
    exclude: ["@huggingface/transformers"],
  },
}));

