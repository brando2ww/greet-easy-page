

## Inverter imagens entre os cards da Home

### Mudança

**`src/pages/Home.tsx`** (linhas 37-49):
- Card **"stations"**: trocar `evChargerBg` (fundo) por `chargerStation` com classes `absolute top-8 left-4 h-20 object-contain pointer-events-none`
- Card **"startCharging"**: trocar `chargerStation` por `evChargerBg` com classes `absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none`

```tsx
{card.key === "stations" && (
  <img
    src={chargerStation}
    alt=""
    className="absolute top-8 left-4 h-20 object-contain pointer-events-none"
  />
)}
{card.key === "startCharging" && (
  <img
    src={evChargerBg}
    alt=""
    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
  />
)}
```

Um arquivo, troca direta de `src` e `className` entre os dois blocos.

