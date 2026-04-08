

## Ajustar imagem do carregador no card "Iniciar Carga"

### Mudança

**`src/pages/Home.tsx`**:
- Reduzir a altura da imagem de `h-28` para `h-20`.
- Reposicionar de `right-2` para `right-6` (mais à esquerda dentro do card).

```tsx
{card.key === "startCharging" && (
  <img
    src={chargerStation}
    alt=""
    className="absolute top-2 right-6 h-20 object-contain pointer-events-none"
  />
)}
```

Um arquivo, uma linha alterada.

