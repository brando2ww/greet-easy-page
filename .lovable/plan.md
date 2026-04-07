

## Reposicionar texto dos cards para acima da seta

### Mudança

**`src/pages/Home.tsx`**:
- Alterar o flex do conteúdo de `justify-between` para `justify-end`, e adicionar `gap-2` para que o texto fique logo acima da seta, ambos na parte inferior do card.

```tsx
<div className="flex flex-col h-full justify-end gap-2 relative z-10">
  <span className="font-semibold text-base text-foreground">
    {t(`home.${card.key}`)}
  </span>
  <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center">
    <ArrowRight className="w-4 h-4 text-background" />
  </div>
</div>
```

Um arquivo, uma linha alterada.

