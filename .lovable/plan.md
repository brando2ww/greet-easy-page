

## Aumentar altura dos cards na Home

### Mudança

**`src/pages/Home.tsx`**:
- Adicionar uma altura mínima aos cards para ocupar o espaço equivalente a um grid 2x2. Adicionar `min-h-[140px]` ao `Card` dentro do grid, e usar `justify-between` no flex interno para distribuir o conteúdo verticalmente.

```tsx
<Card className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full border-border/50 min-h-[140px]">
  <div className="flex flex-col gap-3 h-full justify-between">
```

Um arquivo, dois valores alterados.

