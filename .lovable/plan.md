

## Skeleton de carregamento na Home

### O que muda

Adicionar estado de loading para os action cards e o bottom menu, mostrando placeholders com animação de skeleton enquanto o conteúdo carrega.

### Mudanças técnicas

**`src/pages/Home.tsx`**:
- Usar `isLoading` do `useChargingHistory` e um estado `imagesLoaded` para controlar quando as imagens dos cards terminaram de carregar
- Adicionar um estado `useState` que começa `false` e vira `true` após um pequeno delay ou quando as imagens carregarem (usando `onLoad` nos `<img>`)
- Quando `!ready`, mostrar skeletons no lugar dos action cards (2 retângulos com `Skeleton` de 200px de altura) e na seção de sessões recentes
- Passar uma prop `loading` ou usar o mesmo estado para controlar a exibição do bottom nav

**`src/components/BottomNavigation.tsx`**:
- Adicionar uma animação de entrada (fade-in) para que o menu apareça suavemente ao carregar, usando `motion.nav` com `initial={{ opacity: 0 }}` e `animate={{ opacity: 1 }}`

**Skeleton dos cards** (dentro de Home.tsx):
```
<div className="grid grid-cols-2 gap-3">
  <Skeleton className="min-h-[200px] rounded-lg" />
  <Skeleton className="min-h-[200px] rounded-lg" />
</div>
```

**Lógica**: Usar um `useState(false)` + `useEffect` com um curto timeout (~300ms) ou preload das imagens para alternar para o conteúdo real, garantindo transição suave.

### Arquivos editados
- `src/pages/Home.tsx` — adicionar skeleton state e componentes
- `src/components/BottomNavigation.tsx` — adicionar animação de entrada fade-in

