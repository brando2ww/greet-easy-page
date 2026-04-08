

## Adicionar sombra no carro do banner

### Mudança

**`src/pages/Home.tsx`**: Adicionar `drop-shadow-2xl` (ou filtro CSS customizado) na classe da imagem do carro para criar efeito de sombra.

Alterar a classe de:
```
className="absolute right-[-20px] -bottom-16 h-[275px] object-contain pointer-events-none"
```
Para:
```
className="absolute right-[-20px] -bottom-16 h-[275px] object-contain pointer-events-none drop-shadow-2xl"
```

### Arquivo editado
- `src/pages/Home.tsx`

