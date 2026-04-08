

## Reduzir texto do banner para duas linhas

O texto "Carregue seu Veículo Facilmente" ainda quebra em 3 linhas no viewport de 390px porque o `max-w-[55%]` limita o container de texto.

### Mudança

**`src/pages/Home.tsx`** (linha ~125):

Alterar o texto de:
```
Carregue seu Veículo Facilmente
```

Para:
```
Carregue seu Veículo
```

E aumentar o `max-w` do container de texto de `max-w-[55%]` para `max-w-[60%]` para dar mais espaço.

### Arquivo editado
- `src/pages/Home.tsx`

