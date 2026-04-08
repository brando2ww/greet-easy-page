

## Alinhar imagem do carregador com o texto no card

### Problema
A imagem está centralizada no card (`left-1/2 -translate-x-1/2`), mas o texto está alinhado à esquerda com padding de 16px (`p-4`). Precisamos alinhar a imagem à esquerda, começando no mesmo ponto que o texto.

### Mudança

**`src/pages/Home.tsx`** (linha 48):
- Trocar `left-1/2 -translate-x-1/2` por `left-4` para alinhar a imagem com o padding do card onde o texto começa.

```tsx
className="absolute top-2 left-4 h-20 object-contain pointer-events-none"
```

Um arquivo, uma linha alterada.

