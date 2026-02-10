

## Fix: Charger Status Not Resetting After Session Ends

### Problema Atual
O carregador 140414 (ZETA UNO VILLAGIO) tem `status: in_use` no banco de dados, mas a ultima sessao ja foi finalizada (`completed`, `stop_reason: Remote`). O update do status para `available` falhou silenciosamente durante o stop.

### Correcao Imediata (dados)
Atualizar o status do carregador diretamente no banco:

```sql
UPDATE chargers SET status = 'available' WHERE id = 'd7788cde-2d67-4d8e-bd7e-45d51d444a48';
```

### Correcao no Codigo (prevencao)

**File: `supabase/functions/charger-commands/index.ts`**

No action `stop`, o update do charger status acontece sem verificacao de erro. Adicionar tratamento de erro e tambem adicionar uma verificacao de consistencia: se a sessao e `completed` mas o charger ainda esta `in_use`, corrigir automaticamente.

1. **Melhorar o stop action** - Adicionar `error handling` ao update do status do charger e logar se falhar
2. **Adicionar verificacao no status action** - Quando o status do charger e consultado, verificar se ha sessoes ativas. Se nao houver e o charger estiver `in_use`, corrigir automaticamente para `available`

### Detalhes Tecnicos

**Arquivo: `supabase/functions/charger-commands/index.ts`**

**Mudanca 1 - Stop action (melhorar error handling):**
Apos o update do charger status, verificar se houve erro:

```typescript
const { error: updateError } = await supabaseAdmin
  .from('chargers')
  .update({ status: 'available' })
  .eq('id', chargerId);

if (updateError) {
  console.error('[charger-commands] Failed to update charger status:', updateError);
}
```

**Mudanca 2 - Status action (auto-correcao):**
No case `status`, apos buscar o charger, verificar consistencia:

```typescript
// Auto-fix: if charger is "in_use" but no active sessions exist, reset to available
const { data: chargerFull } = await supabaseAdmin
  .from('chargers')
  .select('status')
  .eq('id', chargerId)
  .single();

if (chargerFull?.status === 'in_use') {
  const { data: activeSessions } = await supabaseAdmin
    .from('charging_sessions')
    .select('id')
    .eq('charger_id', chargerId)
    .eq('status', 'in_progress')
    .limit(1);

  if (!activeSessions || activeSessions.length === 0) {
    await supabaseAdmin
      .from('chargers')
      .update({ status: 'available' })
      .eq('id', chargerId);
    console.log('[charger-commands] Auto-fixed stale in_use status for charger:', chargerId);
  }
}
```

**Mudanca 3 - Start action (verificacao similar):**
Antes de rejeitar por `status !== 'available'`, verificar se realmente ha sessao ativa. Se nao houver, corrigir e permitir o start.

Isso cria uma "auto-correcao" que resolve o problema caso o update falhe novamente no futuro.

