

## Skeleton completo na Home (logo + cards + sessões)

### Problema
O logo e as imagens aparecem com delay perceptível porque o skeleton só cobre os action cards, mas o logo e o header ficam visíveis sem conteúdo durante o carregamento.

### Solução
Envolver **todo o conteúdo** da Home num estado `ready`, mostrando skeletons para o logo, os cards e as sessões recentes enquanto as imagens carregam.

### Mudanças em `src/pages/Home.tsx`

Quando `!ready`, mostrar:
1. **Skeleton do logo** — `<Skeleton className="h-10 w-40 rounded-md" />` no lugar do `<img>`
2. **Skeletons dos cards** — já existem (manter)
3. **Skeletons das sessões** — já existem via `isLoading` (manter)

Quando `ready`, mostrar tudo com `animate-fade-in`.

Estrutura simplificada:
```
{!ready ? (
  <div className="space-y-6">
    <Skeleton className="h-10 w-40 rounded-md" />          {/* logo */}
    <div className="grid grid-cols-2 gap-3">
      <Skeleton className="min-h-[200px] rounded-xl" />    {/* card 1 */}
      <Skeleton className="min-h-[200px] rounded-xl" />    {/* card 2 */}
    </div>
  </div>
) : (
  <div className="space-y-6 animate-fade-in">
    <img src={speedLogo} ... />
    {/* action cards */}
  </div>
)}
```

As imagens hidden de preload permanecem **fora** do condicional para garantir que `onLoad` dispare.

### Arquivo editado
- `src/pages/Home.tsx`

