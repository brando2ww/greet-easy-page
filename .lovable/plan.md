

## Adicionar imagem do plugue como fundo do card

### Mudança

**Copiar imagem**:
- Copiar `user-uploads://image-18.png` para `src/assets/ev-charger-bg.png`

**`src/pages/Home.tsx`**:
- Importar a imagem: `import evChargerBg from "@/assets/ev-charger-bg.png"`
- Adicionar a imagem como fundo dentro de ambos os cards (ou apenas do selecionado "Estações"), usando uma `<img>` posicionada com `absolute` + `opacity` reduzida para não competir com o texto.
- Adicionar `relative overflow-hidden` ao Card e posicionar a imagem no canto inferior direito com opacidade ~20-30%.

```tsx
<Card className="p-4 ... relative overflow-hidden min-h-[140px]">
  <img 
    src={evChargerBg} 
    alt="" 
    className="absolute right-0 bottom-0 w-24 h-full object-cover object-center opacity-20 pointer-events-none"
  />
  <div className="flex flex-col gap-3 h-full justify-between relative z-10">
    ...
  </div>
</Card>
```

Dois arquivos tocados (copiar asset + editar Home.tsx).

