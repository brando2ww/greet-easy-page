

## Adicionar animação de clique nos cards da Home

### Mudança

**`src/pages/Home.tsx`** (linha 36, classe do `Card`):
- Adicionar classes de transição e efeito `active:scale-95` para feedback visual ao toque/clique.

De:
```tsx
className="p-4 hover:shadow-md transition-shadow cursor-pointer h-full border-border/50 min-h-[200px] relative overflow-hidden"
```

Para:
```tsx
className="p-4 hover:shadow-md transition-all duration-200 cursor-pointer h-full border-border/50 min-h-[200px] relative overflow-hidden active:scale-[0.97]"
```

Isso aplica um leve "encolhimento" ao pressionar o card, dando feedback tátil imediato. Um arquivo, uma linha.

