

## Mapa em escala de cinza

### Mudança

**`src/components/map/StationsMap.tsx`**: Alterar o estilo do mapa de `mapbox://styles/mapbox/streets-v12` para `mapbox://styles/mapbox/light-v11` e aplicar um filtro CSS `grayscale(100%)` no container do mapa para garantir que fique totalmente sem cores.

### Detalhes técnicos
- Trocar o style do Mapbox para `light-v11` (mais neutro)
- Adicionar classe CSS `grayscale` (Tailwind) no `div` do mapa para remover todas as cores
- Os markers dos carregadores continuarão coloridos pois ficam em camada separada

### Arquivo editado
- `src/components/map/StationsMap.tsx`

