

## Reduzir altura do header pela metade

### Mudanças

**`src/pages/Estacoes.tsx`** (linha 75):
- Reduzir padding: `px-4 pt-2 pb-4` → `px-4 pt-1 pb-1`
- Reduzir logo: `h-10` → `h-6`

**`src/components/MobileLayout.tsx`**:
- Reduzir safe area do header: `pt-6` → `pt-3` (linha 15)
- Reduzir offset do conteúdo: `pt-20` → `pt-12` (linha 24)

### Arquivos editados
- `src/pages/Estacoes.tsx`
- `src/components/MobileLayout.tsx`

