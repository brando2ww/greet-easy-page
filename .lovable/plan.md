

## Remover filtros da página de Estações

### Mudanças

**`src/pages/Estacoes.tsx`**:
- Remover o estado `activeFilters` e a função `toggleFilter`
- Remover o array `filterChips`
- Remover o bloco de badges/chips de filtro do `floatingControls` (linhas ~103-119)
- Simplificar o `filteredChargers` para não depender de filtros de status

