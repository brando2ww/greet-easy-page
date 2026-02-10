

## Fix: React Duplicate Instance Error

### Problem
The app shows a blank screen with "Cannot read properties of null (reading 'useEffect')" at `QueryClientProvider`. This is a classic **React duplicate instance** error where Vite's dependency cache has two different copies of React loaded simultaneously.

### Root Cause
This is NOT a code bug. It's a Vite build cache issue that sometimes occurs after multiple rapid code changes. The `.vite/deps` cache gets out of sync.

### Solution
Force Vite to deduplicate React by adding explicit `resolve.dedupe` in the Vite config. This ensures only one copy of React is ever loaded.

### Technical Change

**File: `vite.config.ts`**

Add `resolve.dedupe` for React packages:

```typescript
resolve: {
  alias: {
    "@": path.resolve(__dirname, "./src"),
  },
  dedupe: ["react", "react-dom"],
},
```

This is a one-line addition that permanently prevents the duplicate React issue from recurring.

