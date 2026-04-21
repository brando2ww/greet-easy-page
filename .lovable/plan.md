

## Plano: hardening do servidor OCPP para produção

Aplicar os ajustes da revisão técnica para tornar o `ocpp-standalone-server/server.js` resiliente a reinícios, falhas silenciosas, dados ausentes e conexões não autenticadas — sem alterar a lógica de negócio que já funciona para o ZETA UNO.

## O que vou fazer

### 1. Persistir `transactionIdCounter` no boot

Antes de iniciar o `httpServer.listen`, consultar o Supabase:

```text
SELECT COALESCE(MAX(transaction_id), 1000) AS max_tx FROM charging_sessions
```

Inicializar `transactionIdCounter = max_tx + 1`. Se a query falhar, fallback para `1000` com log de aviso. Garante que reinícios não causem colisão de `transaction_id`.

### 2. Trocar `.single()` por `.maybeSingle()` com tratamento

Em `handleStartTransaction`, `handleStopTransaction`, `handleAuthorize`, `handleStatusNotification`, `handleMeterValues` — toda chamada `.single()` para buscar charger/session vira `.maybeSingle()`. Se retornar `null`:
- Logar com `[OCPP][warn]` o `chargePointId` e contexto.
- Responder ao charger com payload válido (ex: `Authorize` → `Invalid`, `StartTransaction` → ainda aceitar com `transactionId` mas marcar sessão como órfã).

### 3. Fallback robusto em `handleStopTransaction`

Garantir que `cost` nunca seja `NaN`:
- Se `session.chargers?.price_per_kwh` ausente, usar `0.80` (default documentado em `mem://configuracoes/precos-padrao-carregamento`).
- Se `meter_start`/`meter_stop` ausentes, usar `energy_consumed` da última `meter_value` ou `0`.
- Validar `Number.isFinite(cost)` antes de gravar no banco.

### 4. Heartbeat WebSocket (ping/pong)

Adicionar após registrar cada conexão:

```text
ws.isAlive = true;
ws.on('pong', () => { ws.isAlive = true; });
```

Intervalo global a cada 30s percorre `wss.clients`:
- Se `ws.isAlive === false` → `ws.terminate()` e remover de `activeConnections` + `messageBuffer`.
- Senão setar `ws.isAlive = false` e enviar `ws.ping()`.

Limpar o intervalo no `wss.on('close')`.

### 5. Validar path do upgrade WebSocket

No handler de `upgrade`:
- Aceitar apenas paths no formato `/CP_ID` ou `/ocpp/CP_ID` (1 segmento útil).
- Rejeitar com `socket.destroy()` se path tiver segmentos extras ou estiver vazio.
- Logar tentativas inválidas com IP de origem.

### 6. Rastreamento de pending CALLs do servidor → charger

Já existe `pendingCalls` (Map) adicionado no plano anterior para `GetConfiguration`/`ChangeConfiguration`. Estender para todos os comandos enviados pelo servidor:
- `RemoteStartTransaction`, `RemoteStopTransaction`, `TriggerMessage`, `Reset`, `UnlockConnector`.
- Wrapper `sendCallAndWait(ws, action, payload, timeoutMs = 30000)` que retorna Promise resolvida no `CALLRESULT` ou rejeitada no `CALLERROR`/timeout.
- Endpoints `/api/remote-start`, `/api/remote-stop`, `/api/trigger-message` passam a usar esse wrapper e retornam o resultado real do charger ao chamador (Edge Function).

Benefício imediato: a UI saberá se o XIRU **realmente aceitou** o `RemoteStart` ou rejeitou silenciosamente.

### 7. Autenticação WebSocket (Basic Auth opcional)

Nova coluna no banco: `chargers.ocpp_auth_password text` (nullable). Migration cria a coluna sem default — chargers existentes continuam aceitando sem senha (compatibilidade).

No handler de `upgrade`:
- Extrair header `Authorization: Basic ...`.
- Buscar charger por `ocpp_charge_point_id`.
- Se `charger.ocpp_auth_password` está definido e header não bate → rejeitar com `401`.
- Se está `null` → aceitar (modo legado, com warning no log).

UI admin (`src/pages/admin/Carregadores.tsx` ou edição de charger): adicionar campo opcional "Senha OCPP" para definir/alterar.

### 8. Logs estruturados

Padronizar prefixos:
- `[OCPP][conn]` — conexões/desconexões
- `[OCPP][in]` — mensagens recebidas
- `[OCPP][out]` — mensagens enviadas
- `[OCPP][warn]` — situações inesperadas mas não fatais
- `[OCPP][err]` — erros que requerem atenção

Facilita filtrar com `journalctl -u ocpp-server | grep '\[OCPP\]\[err\]'`.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `ocpp-standalone-server/server.js` | Itens 1-8 acima |
| `supabase/migrations/<novo>.sql` | `ALTER TABLE chargers ADD COLUMN ocpp_auth_password text` |
| `src/integrations/supabase/types.ts` | Regenerado automaticamente pela migration |
| `src/pages/admin/Carregadores.tsx` | Campo opcional "Senha OCPP" no form de edição |
| `supabase/functions/charger-commands/index.ts` | Repassar resultado real do charger (do `sendCallAndWait`) ao frontend |

## O que NÃO vou mexer

- Handlers existentes que funcionam para o ZETA UNO — apenas adiciono `.maybeSingle()` e fallbacks defensivos.
- Negociação de subprotocolo, `noServer: true`, formato de resposta `BootNotification` — todos já corretos.
- Lógica de `awaiting_plug` → `in_progress`.
- Edge Functions `ocpp-diagnostics`, `transactions-api`, `chargers-api`, `wallet-api`.

## Deploy

Após o commit das mudanças:

```text
ssh root@68.183.152.189
cd /opt/ocpp-server && git pull
systemctl restart ocpp-server
journalctl -u ocpp-server -f | grep '\[OCPP\]'
```

A migration roda automaticamente no Supabase. As Edge Functions deployam sozinhas.

## Próximo passo lógico (após esse hardening)

Com `sendCallAndWait` em todos os comandos, o `RemoteStartTransaction` retornará o `status` real (`Accepted`/`Rejected`) do XIRU — isso provavelmente já vai diagnosticar o problema atual sem precisar do `GetConfiguration`. Se vier `Rejected`, sabemos que o firmware está negando antes mesmo do plug.

