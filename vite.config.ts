import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const reactPath = path.resolve(__dirname, "node_modules/react");
const reactDomPath = path.resolve(__dirname, "node_modules/react-dom");

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react/jsx-runtime": path.join(reactPath, "jsx-runtime.js"),
      "react/jsx-dev-runtime": path.join(reactPath, "jsx-dev-runtime.js"),
      "react-dom/client": path.join(reactDomPath, "client.js"),
      react: path.join(reactPath, "index.js"),
      "react-dom": path.join(reactDomPath, "index.js"),
    },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "react/jsx-runtime",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "@tanstack/react-query",
      "react-i18next",
      "i18next",
      "react-router-dom",
    ],
    exclude: ["@huggingface/transformers"],
  },
}));
