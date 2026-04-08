

## Aumentar contraste do mapa

### Problema
O CSS aplica `filter: grayscale(100%)` no canvas do Mapbox, removendo todas as cores e deixando o mapa muito claro e difícil de ler.

### Solução
Reduzir o grayscale e adicionar contraste extra no filtro CSS.

### Mudança

**`src/index.css`** (linha ~225, regra `.mapboxgl-canvas`):
- Alterar de `filter: grayscale(100%)` para `filter: grayscale(30%) contrast(1.1)` — mantém um visual discreto mas com muito mais legibilidade de ruas, cidades e referências geográficas.

### Arquivo editado
- `src/index.css`

