

## Corrigir hover do botão de filtros

### Problema
O botão usa `variant="outline"`, que aplica `hover:text-accent-foreground` (branco no dark mode). O `hover:bg-background/90` neutraliza o fundo, mas não a cor do texto.

### Mudança

**`src/pages/Estacoes.tsx`** (linha 74):
- Adicionar `hover:text-current` à className do botão para manter a cor do ícone no hover.

