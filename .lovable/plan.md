

## Adicionar imagem do carregador no card "Iniciar Carga"

### Mudança

1. **Copiar imagem** `user-uploads://image-19.png` para `src/assets/charger-station.png`.

2. **`src/pages/Home.tsx`**:
   - Importar a nova imagem.
   - No card `startCharging`, adicionar a imagem posicionada no topo/centro do card (estilo flutuante como no Uber "Order food"), usando posição absoluta ou relativa dentro do card.

Layout resultante:
```text
┌─────────────────┐
│      [imagem]    │
│    carregador    │
│                  │
│ Iniciar Carga   │
│ (●→)            │
└─────────────────┘
```

```tsx
{card.key === "startCharging" && (
  <img
    src={chargerStation}
    alt=""
    className="absolute top-2 right-2 h-28 object-contain pointer-events-none"
  />
)}
```

A imagem ficará posicionada no canto superior direito do card, similar ao estilo da referência Uber.

