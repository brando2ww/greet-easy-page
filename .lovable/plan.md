

## Criar tela Home estilo Uber (pós-login, antes do mapa)

### Conceito
Inspirado na screenshot do Uber: tela limpa com saudação, cards de ação rápida em grid 2x2, e seção "Recentes" com últimas sessões de carregamento. A navegação para o mapa (Estações) passa a ser via card ou bottom nav.

### Mudanças

**1. Novo arquivo `src/pages/Home.tsx`**
- Saudação com nome do usuário (do perfil Supabase) e logo
- Grid 2x2 com cards de ação:
  - **Estações** (ícone MapPin) → navega para `/estacoes`
  - **Iniciar Carga** (ícone Zap) → navega para `/iniciar-carga`
  - **Carteira** (ícone Wallet) → navega para `/carteira`
  - **Veículos** (ícone Car) → navega para `/veiculos`
- Cada card com ícone, título e botão seta (→) — estilo Uber
- Seção "Recentes" com últimas 3 sessões de carregamento (usando `useChargingHistory`)
- Usa `ResponsiveLayout` com `showBottomNav`

**2. Atualizar `src/App.tsx`**
- Rota `/` → `Home` (novo)
- Rota `/estacoes` → `Estacoes` (mapa, movido do `/`)
- Importar novo componente Home

**3. Atualizar `src/components/RoleBasedRedirect.tsx`**
- Usuário regular → renderiza `Home` em vez de `Estacoes`

**4. Atualizar `src/components/BottomNavigation.tsx`**
- Primeiro item: Home (ícone House, path `/`)
- Segundo item: Estações (ícone MapPin, path `/estacoes`)

**5. Atualizar `src/components/Header.tsx`** (desktop nav)
- Adicionar item Home no início
- Mover Estações para `/estacoes`

**6. Atualizar arquivos de tradução** (`en.json`, `pt.json`, `es.json`, `zh.json`)
- Adicionar chaves: `home.greeting`, `home.stations`, `home.startCharging`, `home.wallet`, `home.vehicles`, `home.recent`, `navigation.home`

**7. Corrigir erro `useContext`**
- O runtime error de `useContext` null é causado pelos aliases do Vite. Será resolvido simplificando o `vite.config.ts` (remover aliases explícitos de react, manter apenas `@` e `dedupe`).

### Resultado
Ao abrir o app após login, o usuário vê uma Home limpa com ações rápidas em cards. O mapa fica acessível via card "Estações" ou bottom nav.

