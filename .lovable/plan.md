

## Botão de notificação escuro

### Mudança

**`src/pages/Home.tsx`** (linha ~51):

Trocar o `Button` de `variant="outline"` para estilo com fundo escuro (`bg-foreground`), ícone branco (`text-white`), sem efeito hover:

De:
```tsx
<Button variant="outline" size="icon" className="relative rounded-full">
```

Para:
```tsx
<Button variant="ghost" size="icon" className="relative rounded-full bg-foreground hover:bg-foreground text-white">
```

E garantir que o ícone `Bell` use `text-white` (ou herde do pai).

