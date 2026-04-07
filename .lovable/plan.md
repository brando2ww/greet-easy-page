

## Corrigir erro de React duplicado (useContext is null) + confirmar ícone LocateFixed

### Situação atual

O ícone **já foi trocado** para `LocateFixed` no código (linha 5 do StationsMap.tsx). O motivo de parecer "igual" é que o app está crashando com `Cannot read properties of null (reading 'useContext')` — erro de React duplicado — então o mapa nem renderiza.

A configuração anterior no `vite.config.ts` com `force: true` e aliases não resolveu. Provavelmente o `force: true` está re-otimizando de forma inconsistente.

### Plano

1. **Simplificar `vite.config.ts`** — remover `force: true` e os aliases extras de `react/jsx-runtime` e `react-dom/client` que podem estar causando conflito. Manter apenas:
   - `resolve.alias` para `@`, `react`, e `react-dom`
   - `resolve.dedupe` para `["react", "react-dom"]`
   - `optimizeDeps.include` com as dependências core (sem `react/jsx-runtime` etc.)

2. **Limpar cache do Vite** — deletar `node_modules/.vite` para forçar rebuild limpo dos deps.

### Arquivo alterado
| Arquivo | Mudança |
|---------|---------|
| `vite.config.ts` | Simplificar configuração de resolve/optimizeDeps |

### Resultado esperado
App volta a funcionar, mapa renderiza, e o ícone `LocateFixed` aparece no botão de localização.

