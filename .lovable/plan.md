

## Cores apenas nos markers do mapa

### Problema atual
A classe `grayscale` está aplicada no container inteiro do mapa, o que remove as cores de tudo — incluindo os markers dos carregadores e o ponto de localização do usuário.

### Solução
Mover o filtro `grayscale` para afetar apenas o canvas do Mapbox (tiles/mapa base), mantendo os markers com suas cores originais. Isso será feito separando as camadas:

**`src/components/map/StationsMap.tsx`**:
- Remover `grayscale` do `div` do mapa
- Aplicar o grayscale via CSS apenas no canvas do Mapbox usando um seletor `.mapboxgl-canvas` no index.css

**`src/index.css`**:
- Adicionar regra CSS:
```css
.mapboxgl-canvas {
  filter: grayscale(100%);
}
```

Isso garante que apenas os tiles do mapa fiquem cinza, enquanto os markers (carregadores coloridos e ponto azul de localização) mantêm suas cores.

### Arquivos editados
- `src/components/map/StationsMap.tsx`
- `src/index.css`

