

## Fix: Hover dos botões de valor rápido

**Arquivo:** `src/pages/Carteira.tsx` (linha 191)

Adicionar classe `hover:bg-muted` nos botões de valor rápido para sobrescrever o hover roxo/rosa do variant `outline`.

**Mudança:**
```tsx
// Linha 191 - adicionar hover:bg-muted em ambos os estados
className={amount === v.toString() ? "border-primary bg-primary/10 hover:bg-primary/10" : "hover:bg-muted"}
```

