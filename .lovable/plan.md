

## Reestruturar layout dos cards na Home (estilo Uber)

### Mudança

**`src/pages/Home.tsx`**:
- Remover o `div` do ícone (MapPin/Zap) de dentro dos cards.
- Reorganizar o conteúdo: nome do card no topo, seta (ArrowRight) dentro de um círculo preto no canto inferior esquerdo.
- Remover imports não utilizados (`MapPin`, `Zap`).
- Remover `color` do array `actionCards` (não mais necessário).

Layout resultante de cada card:
```text
┌─────────────────┐
│ Estações        │
│                 │
│                 │
│ (●→)            │
└─────────────────┘
```

```tsx
<div className="flex flex-col h-full justify-between relative z-10">
  <span className="font-semibold text-base text-foreground">
    {t(`home.${card.key}`)}
  </span>
  <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center">
    <ArrowRight className="w-4 h-4 text-white" />
  </div>
</div>
```

Um arquivo editado.

