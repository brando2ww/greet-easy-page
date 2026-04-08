

## Remover retângulo branco e fazer o mapa ocupar toda a tela

### Problema
O `MobileLayout` aplica `pb-16` no `<main>`, criando um espaço branco fixo embaixo. Como o menu agora é flutuante (`bottom-6`, `rounded-full`), esse padding não é mais necessário — ele cria o retângulo branco visível atrás do menu.

### Mudança

**`src/components/MobileLayout.tsx`** (linha 23):
- Remover `pb-16` da classe do `<main>`, permitindo que o conteúdo (mapa) ocupe 100% da altura disponível.

De:
```tsx
"flex-1 flex flex-col pb-16 overflow-y-auto scrollbar-hide"
```
Para:
```tsx
"flex-1 flex flex-col overflow-y-auto scrollbar-hide"
```

O menu flutuante já está posicionado com `fixed bottom-6` e `z-50`, então não precisa de espaço reservado.

