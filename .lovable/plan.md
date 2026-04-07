

## Corrigir tela travada — alias do Vite quebrando resolução do React

### Problema raiz

Os logs mostram:
```
Could not read from file: /dev-server/node_modules/react/index.js/jsx-runtime
```

O esbuild (usado pelo `optimizeDeps`) está aplicando o alias `react → react/index.js` e depois tentando resolver sub-paths como `react/jsx-runtime` → `react/index.js/jsx-runtime`, que não existe. Isso crashou o dev server.

### Solução

Simplificar `vite.config.ts` removendo **todos** os aliases de `react` e `react-dom`. Manter apenas:
- Alias `@` → `./src`
- `resolve.dedupe: ["react", "react-dom"]` (suficiente para garantir instância única)
- `optimizeDeps.include` com os pacotes core (sem sub-paths explícitos)

Depois, limpar o cache do Vite (`node_modules/.vite`).

### Mudança

**`vite.config.ts`**:
```ts
export default defineConfig(({ mode }) => ({
  server: { host: "::", port: 8080 },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom"],
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom",
      "@tanstack/react-query",
      "react-i18next",
      "i18next",
      "react-router-dom",
    ],
    exclude: ["@huggingface/transformers"],
  },
}));
```

Limpar cache: `rm -rf node_modules/.vite`

### Resultado esperado
Dev server inicia sem erros, app renderiza, mapa com ícone LocateFixed visível.

