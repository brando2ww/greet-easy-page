

## Alinhar imagem do carregador à esquerda no card

### Mudança

**`src/pages/Home.tsx`** (linha 48):
- Mudar posicionamento de `right-6` para `left-1/2 -translate-x-1/2` para centralizar a imagem no card, ou usar `right-10` para empurrá-la mais à esquerda.

Dado que o texto está no canto inferior esquerdo, a melhor abordagem é centralizar a imagem horizontalmente no card:

```tsx
className="absolute top-2 left-1/2 -translate-x-1/2 h-20 object-contain pointer-events-none"
```

Isso centraliza a imagem no card, alinhando-a melhor com o texto abaixo.

