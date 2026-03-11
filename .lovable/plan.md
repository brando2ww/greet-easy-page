

## Mover "Carteira" para ao lado de "Dashboard" na navegação

Reordenar o array `navItems` nos 3 componentes de navegação para que "Carteira" fique na segunda posição, logo após "Dashboard".

**Ordem atual:** Dashboard → Carregadores → Relatórios → Carteira → Perfil
**Nova ordem:** Dashboard → Carteira → Carregadores → Relatórios → Perfil

| Arquivo | Mudança |
|---------|---------|
| `src/components/AdminNavigation.tsx` | Mover item Wallet para 2ª posição |
| `src/components/AdminSidebar.tsx` | Mover item Wallet para 2ª posição |
| `src/components/AdminHeader.tsx` | Mover item Wallet para 2ª posição |

