

## Remover efeito hover do botão de notificação

### Mudança

**`src/pages/Home.tsx`** (linha ~51):

Adicionar `hover:text-white` ao className do Button para evitar que o variant ghost sobreponha a cor do texto no hover:

De:
```tsx
className="relative rounded-full bg-foreground hover:bg-foreground text-white"
```

Para:
```tsx
className="relative rounded-full bg-foreground hover:bg-foreground text-white hover:text-white"
```

