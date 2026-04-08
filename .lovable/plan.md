

## Adicionar filtros com animação ao botão de filtros

### Resumo
Remover o efeito hover do botão de filtros e adicionar um painel de filtros por status que aparece/desaparece com animação ao clicar no botão.

### Mudanças

**`src/pages/Estacoes.tsx`**:
- Adicionar estado `showFilters` (boolean) e `statusFilter` (string, default `"all"`)
- Adicionar handler `toggleFilters` no botão `SlidersHorizontal`
- Remover hover do botão: adicionar `hover:bg-background/90` para neutralizar o hover padrão do variant outline
- Abaixo da barra de busca, renderizar condicionalmente um painel de chips de filtro (Disponível, Em Uso, Manutenção, Offline) com animação de slide-down + fade-in usando `transition-all duration-300` e classes de altura/opacidade
- Atualizar `filteredChargers` para também filtrar por `statusFilter` quando diferente de `"all"`
- Importar `Badge` de `@/components/ui/badge`

### Filtros disponíveis
- Todos (valor: `"all"`)
- Disponível (valor: `"available"`)
- Em Uso (valor: `"in_use"`)
- Manutenção (valor: `"maintenance"`)
- Offline (valor: `"offline"`)

### Animação
O painel de filtros usará `overflow-hidden transition-all duration-300 ease-out` com altura e opacidade condicionais: quando `showFilters` é true, `max-h-20 opacity-100 mt-2`; quando false, `max-h-0 opacity-0 mt-0`.

### Arquivo editado
- `src/pages/Estacoes.tsx`

