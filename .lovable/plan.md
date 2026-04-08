

## Adicionar mais margem acima do header

### Mudança

**`src/components/MobileLayout.tsx`** (linha 15):
- Adicionar `pt-6` (24px) ao header fixo para dar mais espaço acima do conteúdo do header (safe area / respiro visual)

De:
```tsx
"fixed top-0 left-0 right-0 bg-background z-40 max-w-md mx-auto"
```
Para:
```tsx
"fixed top-0 left-0 right-0 bg-background z-40 max-w-md mx-auto pt-6"
```

- Ajustar o padding-top do `<main>` de `pt-14` para `pt-20` para compensar o header mais alto (linha 24)

