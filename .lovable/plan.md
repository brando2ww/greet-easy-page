

## Adicionar espaço grande no topo da Home

### Mudança

**`src/pages/Home.tsx`** (linha 28):
- Alterar `py-4` para `pt-24 pb-32` no container principal, adicionando ~6rem (96px) de padding no topo antes do logo.

```
<div className="px-4 pt-24 space-y-6 pb-32">
```

Um valor alterado, um arquivo.

