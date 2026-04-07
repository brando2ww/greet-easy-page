

## Aumentar o marcador de "Minha Localização" no mapa

### Mudança

**`src/components/map/StationsMap.tsx`** (linhas 117-121):

Aumentar as dimensões do container, do anel pulsante e do ponto central:

| Elemento | Atual | Novo |
|----------|-------|------|
| Container | 40x40px | 60x60px |
| Anel pulsante | 36x36px | 52x52px |
| Ponto central | 14x14px | 22x22px |
| Borda branca | 3px | 4px |

```html
<div style="position:relative;width:60px;height:60px;...">
  <div style="...width:52px;height:52px;..."></div>
  <div style="width:22px;height:22px;...border:4px solid white;..."></div>
</div>
```

Um único arquivo, 3 valores numéricos alterados.

