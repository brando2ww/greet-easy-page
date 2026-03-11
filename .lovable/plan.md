

## Remover opacidade da imagem do logo

**Arquivo: `src/pages/AuthWelcome.tsx`** — Remover `opacity-20` da classe da imagem para exibir com opacidade original (100%).

**Antes:**
```tsx
className="h-40 object-contain opacity-20 pointer-events-none"
```

**Depois:**
```tsx
className="h-40 object-contain pointer-events-none"
```

