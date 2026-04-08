

## Mudar fundo do bottom menu para branco

### Mudanca

**`src/components/BottomNavigation.tsx`** (linha 19):
- Trocar `bg-foreground` por `bg-background` no container do menu
- Ajustar cor dos icones inativos de `text-background/60` para `text-foreground/40`

De:
```tsx
<div className="flex items-center gap-2 bg-foreground rounded-full px-4 py-3 shadow-lg">
```
Para:
```tsx
<div className="flex items-center gap-2 bg-background rounded-full px-4 py-3 shadow-lg border border-border/50">
```

E icones inativos (linha 42):
```tsx
: "text-foreground/40"
```

Adiciona `border border-border/50` para dar definicao visual ao menu branco sobre fundos claros.

