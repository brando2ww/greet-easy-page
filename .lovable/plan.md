

## Mapa escuro e dessaturado como na referência

### Problema
O filtro atual `grayscale(15%) contrast(1.15)` deixa o mapa quase totalmente colorido. A imagem de referência mostra um mapa completamente dessaturado (cinza) com bom contraste.

### Solução

**`src/index.css`** — alterar o filtro `.mapboxgl-canvas`:
- De: `grayscale(15%) contrast(1.15)`
- Para: `grayscale(100%) brightness(0.92) contrast(1.2)`

Isso remove todas as cores (como na referência), escurece levemente e aumenta o contraste para que ruas e nomes de cidades fiquem bem visíveis.

### Arquivo editado
- `src/index.css`

