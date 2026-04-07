

## Trocar marcador de "Minha Localização" para ponto pulsante estilo Google Maps

### Problema
O marcador azul padrão do Mapbox (pin) é igual aos dos carregadores — só muda a cor. O usuário quer algo visualmente diferente.

### Solução
Substituir o `new mapboxgl.Marker({ color: '#3b82f6' })` por um marcador customizado com HTML: um ponto azul com anel pulsante ao redor (estilo Google Maps / Apple Maps).

### Mudança

**`src/components/map/StationsMap.tsx`** (linhas 115-125):

Criar um elemento HTML customizado para o marcador do usuário:
- Círculo azul sólido de 14px no centro
- Borda branca de 3px
- Anel azul translúcido pulsante ao redor (animação CSS)
- Box-shadow suave

Substituir:
```ts
userMarkerRef.current = new mapboxgl.Marker({ color: '#3b82f6' })
```

Por:
```ts
const el = document.createElement('div');
el.innerHTML = `
  <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
    <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(59,130,246,0.2);animation:pulse-ring 1.5s ease-out infinite;"></div>
    <div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>
  </div>
`;

// Add pulse animation
const style = document.createElement('style');
style.textContent = `@keyframes pulse-ring { 0% { transform:scale(0.5);opacity:1; } 100% { transform:scale(1.2);opacity:0; } }`;
document.head.appendChild(style);

userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
```

### Resultado
Ponto azul com anel pulsante — visualmente distinto dos pins de carregadores.

