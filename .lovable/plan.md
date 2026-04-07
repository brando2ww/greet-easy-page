

## Imagem de fundo apenas no card "Estações" e cobrindo todo o fundo

### Mudança

**`src/pages/Home.tsx`**:
- Mover a `<img>` de fundo para renderizar apenas quando `card.key === "stations"`.
- Alterar as classes da imagem para cobrir todo o card: `w-full h-full object-cover` em vez de `w-24`.

```tsx
{card.key === "stations" && (
  <img
    src={evChargerBg}
    alt=""
    className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
  />
)}
```

Um arquivo, uma condição adicionada e classes ajustadas.

