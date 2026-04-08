

## Aumentar carro no banner para ultrapassar os limites do card

### Mudança

**`src/pages/Home.tsx`** (linha 132):

Aumentar a altura da imagem do carro de `h-[130px]` para `h-[180px]` e ajustar o `bottom` para um valor negativo para que o carro ultrapasse o topo do card, como na referência.

```tsx
// De:
className="absolute right-[-10px] bottom-0 h-[130px] object-contain pointer-events-none"

// Para:
className="absolute right-[-20px] -bottom-4 h-[180px] object-contain pointer-events-none"
```

### Arquivo editado
- `src/pages/Home.tsx`

