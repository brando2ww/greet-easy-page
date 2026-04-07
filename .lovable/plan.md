

## Sessão criada sem cobrar até plugue conectar

### Problema atual
Quando o usuário inicia o carregamento pelo app, a Edge Function cria a sessão com `started_at: now()` imediatamente. Se o plugue ainda não estiver conectado (OCPP "Available"/"Preparing"), o tempo e custo já começam a acumular. O correto é: criar a sessão para reservar o carregador, mas só iniciar a contagem de tempo e cobrança quando o plugue for de fato conectado (OCPP "Charging").

### Solução

Introduzir um status intermediário `awaiting_plug` na sessão. A sessão é criada com esse status e `started_at` nulo. Quando o OCPP reporta "Charging" (via `StatusNotification` ou `StartTransaction`), o servidor atualiza para `in_progress` e define o `started_at` real.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/charger-commands/index.ts` | Na ação `start`, criar sessão com `status: 'awaiting_plug'` e `started_at: null` em vez de `in_progress` e `now()` |
| `ocpp-standalone-server/server.js` | No `handleStatusNotification`, quando status muda para `Charging`: buscar sessão `awaiting_plug` do charger e atualizar para `in_progress` com `started_at: now()`. No `handleStartTransaction`, em vez de criar sessão nova, buscar a existente com `awaiting_plug` e atualizar com `transaction_id`, `meter_start`, `started_at` e `status: 'in_progress'` |
| `src/pages/Carregamento.tsx` | Tratar `awaiting_plug` como sessão ativa (não completada) mas sem contar tempo/custo. Mostrar status "Aguardando plugue" quando session.status === 'awaiting_plug' |

### Detalhes

**1. Edge Function -- criar sessão em espera**

```js
// Mudar de:
status: 'in_progress',
started_at: new Date().toISOString(),
// Para:
status: 'awaiting_plug',
started_at: null,
```

**2. Servidor OCPP -- ativar sessão no StartTransaction**

No `handleStartTransaction`, em vez de `INSERT` nova sessão, fazer `UPDATE` na sessão existente com `awaiting_plug`:
```js
await supabase
  .from('charging_sessions')
  .update({
    status: 'in_progress',
    started_at: new Date(payload.timestamp).toISOString(),
    transaction_id: transactionId,
    meter_start: payload.meterStart,
  })
  .eq('charger_id', charger.id)
  .eq('status', 'awaiting_plug');
```
Se não encontrar sessão `awaiting_plug` (ex: início local), manter o INSERT atual como fallback.

**3. Servidor OCPP -- fallback no StatusNotification**

Quando `payload.status === 'Charging'`, verificar se há sessão `awaiting_plug` sem `started_at` e ativá-la (caso o `StartTransaction` não tenha chegado ainda):
```js
if (payload.status === 'Charging') {
  // Ativar sessão aguardando plugue
  await supabase
    .from('charging_sessions')
    .update({ status: 'in_progress', started_at: new Date().toISOString() })
    .eq('charger_id', charger.id)
    .eq('status', 'awaiting_plug')
    .is('started_at', null);
}
```

**4. Frontend -- exibir estado de espera**

No `Carregamento.tsx`, considerar `awaiting_plug` como sessão não-completada:
```js
const isCompleted = session?.status === "completed" || session?.status === "cancelled";
const isAwaitingPlug = session?.status === "awaiting_plug";
```
- Timer mostra `00:00:00` fixo quando `isAwaitingPlug` (já funciona porque `isActivelyCharging` é false)
- Custo estimado mostra `R$ 0,00` quando `isAwaitingPlug`
- Status visual: "Aguardando conexão do plugue"

