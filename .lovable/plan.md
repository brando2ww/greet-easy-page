

## Fix: Adicionar navegação na Carteira Admin

O problema é que `CarteiraAdmin.tsx` usa `<ResponsiveLayout>` mas não passa `showBottomNav={true}`, então a navegação inferior (mobile) não aparece.

### Alteração

| Arquivo | Mudança |
|---------|---------|
| `src/pages/admin/CarteiraAdmin.tsx` | Alterar `<ResponsiveLayout>` para `<ResponsiveLayout showBottomNav>` |

Isso resolve tanto o menu inferior no mobile quanto a sidebar no desktop (que já funciona via `ResponsiveLayout` quando detecta admin).

