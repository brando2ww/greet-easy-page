

## Plano: ativar sessão `awaiting_plug` quando XIRU envia `Preparing`

Sua análise está correta. O servidor OCPP só transita `awaiting_plug → in_progress` no `StatusNotification = Charging`, mas o XIRU envia `Preparing` ao detectar o plug e nunca chega em `Charging` sem `StartTransaction` ter sido aceito antes — ou seja, está esperando um evento que nunca virá nesse modelo.

## Correção

### 1. `ocpp-standalone-server/server.js` — `handleStatusNotification`

Expandir o gatilho de ativação:

```text
if (payload.status === 'Preparing' || payload.status === 'Charging') {
  // procurar sessão awaiting_plug deste charger
  // marcar como in_progress
  // started_at = now() (reset para começar billing real agora)
  // disparar RemoteStartTransaction se ainda não foi enviado
}
```

Detalhes:
- Buscar `charging_sessions` com `charger_id = (lookup por ocpp_charge_point_id)` e `status = 'awaiting_plug'`, ordem `created_at desc`, `limit 1`.
- Se encontrada: `update status='in_progress', started_at=now()`. Billing real começa agora (não no momento do RemoteStart).
- Se não encontrada: comportamento atual (apenas atualiza `ocpp_protocol_status`).
- Manter o caminho `Charging` também — alguns chargers pulam direto para `Charging`.

### 2. `ocpp-standalone-server/server.js` — `handleStartTransaction` (race condition)

Hoje o handler procura sessão por `id_tag` ou cria órfã. Adicionar fallback robusto:

- Se `id_tag` não bate, procurar por `charger_id + status IN ('awaiting_plug', 'in_progress') ORDER BY created_at DESC LIMIT 1` antes de criar sessão órfã.
- Vincular `transaction_id` retornado à sessão encontrada.
- Garantir resposta OCPP `[3, msgId, { transactionId, idTagInfo: { status: 'Accepted' } }]` enviada **antes** do update no banco (padrão BootNotification, já documentado em `mem://decisoes-tecnicas/garantia-resposta-bootnotification`).

### 3. `ocpp-standalone-server/server.js` — guard contra dupla ativação

Adicionar idempotência: se sessão já está `in_progress`, não resetar `started_at`. Apenas o **primeiro** evento entre `Preparing`/`Charging`/`StartTransaction` ativa a sessão.

### 4. UI — sem mudanças necessárias

O frontend já reage a `status: 'in_progress'` via realtime do Supabase em `src/pages/Carregamento.tsx`. Assim que o servidor fizer o update, a tela transita automaticamente de "Aguardando plugue" para o cronômetro de carga ativa.

## Arquivo afetado

| Arquivo | Mudança |
|---|---|
| `ocpp-standalone-server/server.js` | `handleStatusNotification` aceita `Preparing` como gatilho; `handleStartTransaction` com fallback por charger; guard de idempotência |

## O que NÃO vou fazer

- Não vou tocar em `handleBootNotification`, `handleMeterValues`, negociação de subprotocolo, nem nas Edge Functions.
- Não vou adicionar hardening (heartbeat ping/pong, basic auth, persistência de counter) — fora do escopo.
- Não vou criar UI nova — a tela já reage corretamente.

## Deploy manual

Após o commit:

```text
ssh root@68.183.152.189
cd /opt/ocpp-server && git pull
systemctl restart ocpp-server
journalctl -u ocpp-server -f
```

## Validação esperada

Próxima tentativa com o XIRU:
1. Você inicia pelo app → sessão criada `awaiting_plug` + RemoteStart enviado.
2. Você pluga o cabo → XIRU envia `StatusNotification(Preparing)`.
3. Servidor agora transita sessão para `in_progress`, `started_at = now()`.
4. UI sai de "Aguardando plugue" e entra no cronômetro.
5. Quando XIRU eventualmente envia `StartTransaction`, vinculamos `transaction_id` à sessão existente (sem criar órfã).

