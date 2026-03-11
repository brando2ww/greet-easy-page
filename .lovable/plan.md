

## Carteira Admin — Recebimento de Faturamento via Stripe/Mercado Pago

### Conceito
Criar uma nova página admin `/admin/carteira` onde o administrador pode:
- Ver o saldo total faturado com os carregadores
- Vincular conta Stripe Connect ou Mercado Pago para receber pagamentos
- Ver histórico de repasses/saques
- Configurar método de recebimento preferido

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/admin/CarteiraAdmin.tsx` — Página com saldo faturado, config de recebimento, histórico |
| Editar | `src/App.tsx` — Adicionar rota `/admin/carteira` |
| Editar | `src/components/AdminSidebar.tsx` — Adicionar item "Carteira" com ícone Wallet |
| Editar | `src/components/AdminNavigation.tsx` — Adicionar item "Carteira" na nav mobile |
| Editar | `src/components/AdminHeader.tsx` — Adicionar item "Carteira" |
| Editar | `src/locales/pt.json` — Adicionar traduções `admin.wallet.*` |
| Editar | `src/locales/en.json` — Adicionar traduções |
| Editar | `src/locales/es.json` — Adicionar traduções |
| Editar | `src/locales/zh.json` — Adicionar traduções |
| Migration | Criar tabela `admin_payment_config` para salvar config de recebimento |
| Editar | `supabase/functions/transactions-api/index.ts` — Adicionar action `adminWallet` para retornar dados de faturamento |

### Tabela `admin_payment_config`

```sql
CREATE TABLE public.admin_payment_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL, -- 'stripe' ou 'mercado_pago'
  account_id text, -- Stripe Connect account ID ou Mercado Pago access token ref
  account_email text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);
-- RLS: somente admin
```

### Página `CarteiraAdmin.tsx`

Estrutura com 2 seções:

**1. Resumo Financeiro**
- Card com receita total (soma de `cost` das sessões completed)
- Card com receita do mês atual
- Card com total de sessões faturadas

**2. Métodos de Recebimento**
- Cards para Stripe e Mercado Pago
- Cada card mostra status (vinculado/não vinculado)
- Botão para vincular/desvincular
- Por enquanto, vincular = salvar email/conta na tabela (integração real com Stripe Connect e Mercado Pago OAuth seria fase futura)

**3. Histórico de faturamento**
- Lista das últimas sessões com custo > 0, mostrando data, carregador, valor

### Edge Function — action `adminWallet`

Retorna:
- `totalRevenue`: soma de `cost` de sessões completed
- `monthRevenue`: soma do mês atual
- `totalSessions`: contagem de sessões com custo
- `recentBilled`: últimas 20 sessões completed com custo
- `paymentConfig`: configurações de recebimento do admin

### Navegação

Adicionar item com ícone `Wallet` entre Relatórios e Perfil nos 3 componentes de nav.

