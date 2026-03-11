

## Remover opção e telas de Clientes

### Alterações

1. **`src/components/AdminNavigation.tsx`** — Remover item `{ icon: Users, label: t('admin.clients'), path: '/admin/clientes' }` do array `navItems`. Remover import `Users`.

2. **`src/components/AdminSidebar.tsx`** — Remover item `{ icon: Users, label: 'admin.clients', path: '/admin/clientes' }` do array `navItems`. Remover `Users` do import.

3. **`src/components/AdminHeader.tsx`** — Remover item de clientes do array `navItems`. Remover `Users` do import.

4. **`src/App.tsx`** — Remover rota `/admin/clientes` e import de `Clientes`.

5. **`src/pages/admin/Clientes.tsx`** — Deletar arquivo (não será mais usado).

