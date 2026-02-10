

## Fix: Force Vite Dependency Cache Rebuild

### Problem
The same "Cannot read properties of null (reading 'useMemo')" error persists despite having `dedupe` configured. The browser is still loading stale cached dependency chunks (note the old version hash `v=3b0d9e88` in the error URL), meaning Vite's pre-bundled dependencies were not regenerated.

### Solution
Add `optimizeDeps.force: true` to `vite.config.ts` to force Vite to re-bundle all dependencies from scratch, clearing the stale cache that contains duplicate React instances.

### Technical Change

**File: `vite.config.ts`**

Add `optimizeDeps` configuration:

```typescript
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  optimizeDeps: {
    force: true,
  },
}));
```

This forces a full dependency re-optimization on the next server start, ensuring all React packages resolve to a single instance.

