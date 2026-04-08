
## Busca e filtros flutuantes sobre o mapa

### Objetivo
Mover a barra de busca e os filtros para fora do header fixo, posicionando-os como elementos flutuantes sobre o mapa. O header conterá apenas o logo.

### Mudanças

**`src/pages/Estacoes.tsx`**:
- O `header` passado ao `mobileHeader` conterá apenas o logo
- A busca + filtros serão renderizados como um `div` flutuante com `absolute/fixed` positioning sobre o mapa (dentro do conteúdo, não no header)
- Usar `z-10`, `top-X`, fundo semi-transparente com `backdrop-blur` para o container flutuante

**`src/pages/Estacoes.tsx`** — estrutura aproximada:
```tsx
// Header: apenas logo
const header = (
  <div className="p-4">
    <img src={speedLogo} alt="Nexcharge" className="h-10" />
  </div>
);

// No return, envolver o mapa com os controles flutuantes:
<div className="h-full flex flex-col relative">
  {/* Floating search + filters */}
  <div className="absolute top-4 left-4 right-4 z-10 space-y-2">
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <Search ... />
        <Input ... className="pl-10 h-11 bg-white/90 backdrop-blur-sm shadow-lg border-0" />
      </div>
      <Button ... className="h-11 w-11 bg-white/90 backdrop-blur-sm shadow-lg border-0" />
    </div>
    <div className="flex gap-2 ...">
      {/* filter chips com fundo semi-transparente */}
    </div>
  </div>
  
  {/* Map / loading / error states */}
  <StationsMap ... />
</div>
```

Também passar `noBorder` ao layout para remover a borda inferior do header minimalista.

### Arquivos editados
- `src/pages/Estacoes.tsx`
