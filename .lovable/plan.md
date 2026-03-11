

## Relatórios com Dados Reais das Sessões

### Dados disponíveis no banco
- **8 sessões** (7 completed, 1 in_progress) no carregador "ZETA UNO VILLAGIO"
- **2 usuários** distintos (brando.contato@gmail.com, paulo@inovadorsolar.com.br)
- **1 carregador** cadastrado
- **3 perfis** registrados
- Período: 10/fev a 26/fev/2026
- Obs: `energy_consumed` e `cost` estão `null` em todas as sessões — os relatórios exibirão contagem de sessões e duração como métricas principais

### Abordagem

Adicionar uma nova action `adminReport` na edge function `transactions-api` que retorna dados agregados (admin only). O frontend consome via `transactionsApi` e exibe na página de Relatórios.

### Edge Function — nova action `adminReport`

Adicionar ao `transactions-api/index.ts` um case `adminReport` que retorna:
- **Resumo geral**: total de sessões, sessões completadas, energia total, receita total, duração média, total de usuários únicos, total de carregadores
- **Sessões por dia** (últimos 30 dias): data, contagem, energia, receita
- **Sessões por carregador**: nome, localização, contagem, energia, receita
- **Sessões recentes** (últimas 20): com nome do carregador, email do usuário, duração, status
- **Sessões por usuário**: email, contagem, energia, receita

### Frontend — `src/pages/admin/Relatorios.tsx`

Reescrever completamente com 3 abas:

**Aba "Visão Geral"**:
- Cards com KPIs: Total de sessões, Sessões completadas, Energia total (kWh), Receita total (R$), Duração média, Usuários únicos
- Gráfico de barras — Sessões por dia (últimos 30 dias) usando Recharts

**Aba "Uso"**:
- Tabela de sessões recentes (data, carregador, usuário, duração, status)
- Gráfico de barras — Sessões por carregador

**Aba "Receita"**:
- Cards com receita total e receita média por sessão
- Tabela de receita por carregador
- Tabela de uso por usuário

### Hook — `src/hooks/useAdminReport.tsx`

Novo hook que chama `transactionsApi.adminReport()` com react-query.

### Arquivos

| Ação | Arquivo |
|------|---------|
| Editar | `supabase/functions/transactions-api/index.ts` — adicionar case `adminReport` |
| Editar | `src/services/api.ts` — adicionar `transactionsApi.adminReport()` |
| Criar | `src/hooks/useAdminReport.tsx` |
| Reescrever | `src/pages/admin/Relatorios.tsx` |

