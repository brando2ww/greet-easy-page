

## Substituir ícone do botão "Iniciar Carga" pela imagem enviada

O usuário quer trocar o ícone SVG (Zap) do botão central da navegação inferior pela imagem do logo (raio verde/azul).

### Mudanças

1. **Copiar** `user-uploads://Design_sem_nome_13.png` para `src/assets/charging-icon.png`
2. **`src/components/BottomNavigation.tsx`** — Importar a imagem e substituir o `<Icon>` do botão de carga pelo `<img>` com a nova imagem (dentro do círculo central).

