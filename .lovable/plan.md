

## Sistema de Carteira com Stripe

Implementar adição de saldo via Stripe Checkout e retirada de saldo (transferência para conta bancária ou estorno).

### Arquitetura

1. **Adicionar saldo** — Usuário escolhe um valor, clicamos na Stripe Checkout Session (via Edge Function), o usuário paga, e um webhook confirma o pagamento e credita o saldo na tabela `wallet_balances`.

2. **Retirar saldo** — Usuário solicita retirada, uma Edge Function valida o saldo e registra a solicitação. A retirada real (Stripe Transfer/Payout) requer conta Stripe Connect do usuário — alternativamente, podemos registrar as solicitações para processamento manual pelo admin.

### Passo a passo

1. **Habilitar Stripe** — Usar a ferramenta de integração Stripe do Lovable para configurar a chave secreta
2. **Tabela `wallet_transactions`** — Criar tabela para registrar histórico (depósitos, retiradas, cobranças de carregamento) com RLS
3. **Edge Function `wallet-api`** — Criar função com ações:
   - `create-checkout`: Cria Stripe Checkout Session para adicionar saldo (valor escolhido pelo usuário)
   - `webhook`: Recebe evento `checkout.session.completed` e credita o saldo
   - `request-withdrawal`: Valida saldo e cria solicitação de retirada
   - `list-transactions`: Lista histórico de transações da carteira
4. **UI da Carteira** — Atualizar `Carteira.tsx`:
   - Drawer de "Adicionar Saldo" com input de valor + botão que redireciona para Stripe Checkout
   - Botão "Solicitar Retirada" com input de valor
   - Seção de histórico de transações (depósitos, retiradas, cobranças)
5. **Página de retorno** — Criar rota `/carteira/sucesso` para quando o pagamento Stripe for confirmado
6. **Traduções** — Adicionar chaves nos arquivos de locale

### Sobre retiradas

Para retiradas reais via Stripe (Payouts/Transfers), seria necessário Stripe Connect com onboarding do usuário. Uma abordagem mais simples e viável para o MVP: registrar solicitações de retirada na tabela e o admin processa manualmente. Podemos evoluir para Stripe Connect depois.

