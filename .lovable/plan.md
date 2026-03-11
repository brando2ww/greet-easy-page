

## Corrigir erro de múltiplas instâncias do React (definitivamente)

A configuração atual de dedupe e aliases já está parcialmente correta, mas faltam subpaths importantes do React que também precisam ser resolvidos para a mesma instância.

### Problema

O `@tanstack/react-query` importa React via um caminho que não está sendo capturado pelos aliases atuais (ex: `react/jsx-dev-runtime`, `react-dom/client`), resultando em duas instâncias do React.

### Solução

Atualizar `vite.config.ts` com aliases mais abrangentes:

| Arquivo | Mudança |
|---------|---------|
| `vite.config.ts` | Adicionar aliases para `react/jsx-runtime`, `react/jsx-dev-runtime`, `react-dom/client`; expandir dedupe e optimizeDeps.include |

**Aliases adicionais:**
- `react/jsx-runtime` → `node_modules/react/jsx-runtime.js`
- `react/jsx-dev-runtime` → `node_modules/react/jsx-dev-runtime.js`
- `react-dom/client` → `node_modules/react-dom/client.js`

**Dedupe expandido** para incluir `react-dom/client`, `react/jsx-dev-runtime`.

**optimizeDeps.include** expandido para incluir `react-dom/client`.

