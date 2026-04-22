

## Escopo aprovado: corrigir rollback agressivo no `charger-commands`

Apenas a Edge Function. **Não mexer no `server.js`.**

### Mudanças em `supabase/functions/charger-commands/index.ts`

#### 1. Log explícito do INSERT da sessão (após linhas 158-170)

Adicionar log de sucesso logo após o check de erro:

```text
if (sessionError) {
  console.error('[charger-commands] Session INSERT FAILED:', sessionError);
  return new Response(JSON.stringify({ error: 'Failed to create session' }), { status: 500, ... });
}
console.log('[charger-commands] Session INSERT OK:', session.id, 'status:', session.status, 'charger:', chargerId);
```

#### 2. Trocar DELETE por UPDATE `cancelled` quando OCPP responde `success: false` (linhas 197-205)

**Antes:**
```text
await supabaseAdmin.from('charging_sessions').delete().eq('id', session.id);
await supabaseAdmin.from('chargers').update({ status: 'available' }).eq('id', chargerId);
```

**Depois:**
```text
await supabaseAdmin
  .from('charging_sessions')
  .update({
    status: 'cancelled',
    ended_at: new Date().toISOString(),
    stop_reason: `RemoteStart ${remoteResult.status || 'Unknown'}: ${remoteResult.message || 'no detail'}`,
  })
  .eq('id', session.id);

await supabaseAdmin.from('chargers').update({ status: 'available' }).eq('id', chargerId);

console.log('[charger-commands] Session marked cancelled (RemoteStart rejected):', session.id, 'reason:', remoteResult.status);
```

#### 3. Trocar DELETE por UPDATE `cancelled` no `catch (fetchError)` (linhas 228-235)

**Antes:**
```text
await supabaseAdmin.from('charging_sessions').delete().eq('id', session.id);
```

**Depois:**
```text
await supabaseAdmin
  .from('charging_sessions')
  .update({
    status: 'cancelled',
    ended_at: new Date().toISOString(),
    stop_reason: 'OCPP server unreachable',
  })
  .eq('id', session.id);

console.log('[charger-commands] Session marked cancelled (OCPP unreachable):', session.id);
```

### O que NÃO será alterado

- `ocpp-standalone-server/server.js` — fora do escopo, versão em produção está estável.
- Lógica de validação de saldo, status OCPP, heartbeat — mantida.
- Resposta HTTP para o cliente em caso de falha — continua `400`/`502` com mensagem amigável.
- Schema do banco — nenhuma migration.

### Arquivo afetado

| Arquivo | Mudança |
|---|---|
| `supabase/functions/charger-commands/index.ts` | Log do INSERT; 2× DELETE → UPDATE `cancelled` com `stop_reason` |

### Validação pós-deploy

Edge function faz redeploy automático. Após implantar:

1. Iniciar uma sessão pelo app.
2. Verificar logs do `charger-commands`: deve aparecer `Session INSERT OK: <uuid>`.
3. Consultar `charging_sessions`:
   - Se XIRU aceitar → registro com `status = 'awaiting_plug'` permanece.
   - Se rejeitar → registro com `status = 'cancelled'` e `stop_reason` populado (auditoria preservada).

### Resultado esperado

- Toda tentativa de iniciar carga deixa rastro em `charging_sessions`.
- Rejeições do XIRU ficam visíveis com motivo no `stop_reason`.
- Sucessos seguem o fluxo normal `awaiting_plug → in_progress`.

