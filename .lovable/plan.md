

## Aumentar contraste do mapa — mais escuro

### Problema
Mesmo com `grayscale(30%) contrast(1.1)`, o estilo `light-v11` do Mapbox continua muito claro para identificar cidades e vias.

### Solução
Duas mudanças combinadas:

1. **`src/components/map/StationsMap.tsx`**: Trocar o estilo do mapa de `mapbox://styles/mapbox/light-v11` para `mapbox://styles/mapbox/streets-v12` — este estilo tem ruas, cidades e referências geográficas com muito mais destaque e cores mais definidas.

2. **`src/index.css`**: Ajustar o filtro CSS para `grayscale(15%) contrast(1.15)` — menos dessaturação e mais contraste para manter legibilidade máxima.

### Arquivos editados
- `src/components/map/StationsMap.tsx`
- `src/index.css`

