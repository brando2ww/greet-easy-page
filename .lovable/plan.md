

## Deixar o bottom menu escuro

### Mudança

**`src/components/BottomNavigation.tsx`** (linha 19):

De:
```tsx
<div className="flex items-center gap-2 bg-background rounded-full px-4 py-3 shadow-lg border border-border/50">
```

Para:
```tsx
<div className="flex items-center gap-2 bg-foreground rounded-full px-4 py-3 shadow-lg border border-transparent">
```

E ajustar a cor dos ícones inativos (linha 42):

De: `text-foreground/40`
Para: `text-background/60`

Isso faz o fundo da pílula ficar escuro (usando `bg-foreground` que é escuro no light mode e claro no dark mode) e os ícones inativos ficam claros para contraste.

