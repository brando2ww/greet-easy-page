

## Admin Dashboard = Tela de Estações (com mapa)

### Problema
O admin vê um dashboard com gráficos em `/admin/dashboard`, mas o desejado é que veja a mesma tela do usuário comum (logo, busca, filtros, mapa com carregadores), mantendo apenas o bottom menu de admin.

### Solução

A tela `Estacoes` já usa `ResponsiveLayout` com `showBottomNav`, e o `ResponsiveLayout` já detecta admin para mostrar `AdminNavigation`. Portanto, basta reutilizar `Estacoes` como dashboard admin.

### Alterações

1. **`src/pages/admin/Dashboard.tsx`** — Substituir todo o conteúdo do componente por um re-export de `Estacoes`:
   ```tsx
   import Estacoes from "@/pages/Estacoes";
   const Dashboard = () => <Estacoes />;
   export default Dashboard;
   ```

2. **`src/components/RoleBasedRedirect.tsx`** — Manter o redirect para `/admin/dashboard` (sem mudança, pois o admin dashboard agora mostrará o mapa).

3. **`src/components/AdminNavigation.tsx`** — Atualizar o path do primeiro item (Dashboard) para apontar para `/admin/dashboard` e garantir que o ícone ativo funcione corretamente (já está correto).

Resultado: Admin logado vê logo Nexcharge, barra de busca, filtros, mapa com carregadores + bottom nav de admin. As outras páginas admin (clientes, carregadores, relatórios) continuam iguais.

