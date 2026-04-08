

## Banner promocional abaixo dos action cards

### O que muda

Adicionar um banner/card escuro (bg-foreground) com a imagem do carro 3D sobreposta e textos sobre a Nexcharge, posicionado entre os action cards e as sessões recentes.

### Design

Baseado na referência enviada:
- Card com fundo escuro (rounded-2xl), padding interno
- Texto em verde (primary) pequeno no topo (ex: "Nexcharge")
- Título em branco, bold (ex: "Carregue seu Veículo Facilmente Aqui")
- Imagem do carro (Design_sem_nome_19.png) posicionada à direita, sobrepondo parcialmente o card (absolute, right, com parte saindo do card via negative margin ou overflow visible)

### Mudanças

**Copiar imagem**: `user-uploads://Design_sem_nome_19.png` → `src/assets/ev-car-3d.png`

**`src/pages/Home.tsx`**:
- Importar a nova imagem
- Adicionar o banner logo após o `</div>` dos action cards (dentro do bloco `ready`), antes das sessões recentes:

```tsx
{/* Banner promocional */}
<div className="relative rounded-2xl bg-foreground p-5 overflow-visible min-h-[140px]">
  <div className="relative z-10 max-w-[55%]">
    <span className="text-primary text-xs font-medium">Nexcharge</span>
    <h3 className="text-white text-lg font-bold leading-tight mt-1">
      Carregue seu Veículo Facilmente Aqui
    </h3>
  </div>
  <img
    src={evCar3d}
    alt=""
    className="absolute right-[-10px] bottom-0 h-[130px] object-contain pointer-events-none"
  />
</div>
```

- Adicionar skeleton correspondente no estado `!ready`: `<Skeleton className="h-[140px] rounded-2xl" />`

### Arquivo editado
- `src/pages/Home.tsx`

