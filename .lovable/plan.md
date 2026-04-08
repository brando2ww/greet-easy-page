

## Remover controles de navegação (zoom) do mapa

### Mudança

**`src/components/map/StationsMap.tsx`**:
- Remover o bloco `map.current.addControl(new mapboxgl.NavigationControl(...))` (linhas ~92-97) para que o zoom seja feito apenas por gestos (pinch/scroll), sem botões visuais.

### Arquivo editado
- `src/components/map/StationsMap.tsx`

