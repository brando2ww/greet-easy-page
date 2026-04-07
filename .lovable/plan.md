

## Manter apenas 2 cards na Home

### Mudança

**`src/pages/Home.tsx`**:
- Reduzir o array `actionCards` para apenas os dois primeiros itens: `stations` (MapPin, /estacoes) e `startCharging` (Zap, /iniciar-carga).
- Remover imports não utilizados: `Wallet`, `Car`.

