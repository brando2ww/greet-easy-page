## Diagnóstico — nova hipótese

Confirmado pelos logs do Droplet: após o restart, o XIRU **não reconectou** ao OCPP server. Não tem `[OCPP Server] New connection attempt` nenhum. Toda vez que o server reinicia (deploy, reboot, crash), o charger fica fora até alguém ir lá fisicamente.

Pior: nosso app valida online/offline lendo `chargers.last_heartbeat` e `ocpp_protocol_status` do DB. Quem escreve essas colunas é o OCPP server. Se o server cair / a WS morrer / o pong-refresh quebrar / um deploy não pegar, o DB congela e o app trava em "Estação offline" — exigindo o `UPDATE` manual.

A causa raiz não é o tamanho da janela de heartbeat nem o sweep — é **dependência única e frágil entre OCPP server e DB**. Precisamos de uma fonte de verdade independente e auto-curativa.

## Solução: live-status + auto-cura via cron

### 1. Nova edge function `ocpp-live-status`

`supabase/functions/ocpp-live-status/index.ts`:
- Aceita `{ chargePointId }`.
- Chama `GET ${OCPP_SERVER_URL}/api/connections` com `x-internal-key`.
- Retorna `{ isLive, ocppStatus, lastHeartbeat }`.
- **Side-effect:** se `isLive=true` mas DB diz `Offline`, faz `UPDATE chargers SET last_heartbeat=NOW(), ocpp_protocol_status='Available' WHERE ocpp_charge_point_id=$1 AND ocpp_protocol_status='Offline'` — auto-cura silenciosa.

Configurar `verify_jwt = true` em `supabase/config.toml`.

### 2. Nova edge function `ocpp-sync-status` (cron, sem JWT)

- Busca lista completa de connections do OCPP server.
- Para cada CP conectado: refresca `last_heartbeat` e promove `Offline → Available` (sem tocar `Charging`/`Preparing`).
- Para CPs no DB com WebSocket NÃO listada e `last_heartbeat > 10 min`: marca `Offline`.
- Protegida por `x-internal-key` no header (chamada só pelo pg_cron).

### 3. Migration: pg_cron a cada 1 min

Habilitar `pg_cron` + `pg_net`, criar job que faz `net.http_post` para `ocpp-sync-status` a cada minuto. Garante que mesmo sem o pong-refresh do server, o DB volte a refletir realidade em ≤60s.

### 4. `useChargerValidation.tsx` e edge `charger-commands` — fallback live-status

Antes de bloquear com "Estação offline":
- Chamar `ocpp-live-status`.
- Se `isLive=true`, prosseguir mesmo que DB diga ofline (a chamada já curou).
- Se `isLive=false`, aí sim bloquear, com mensagem clara: "Carregador desconectado. Vá até a estação, desligue e religue o disjuntor."

Mesma lógica replicada na validação final de `charger-commands → start`.

### 5. (Opcional, defesa em profundidade) `connector_id` + reconnect hint no XIRU

Não dá pra forçar o XIRU a reconectar via software. Mas vamos adicionar log no `[OCPP Server]` quando uma WS cair, mostrando "aguardando reconexão do CP X — se não voltar em 60s, religar disjuntor" — pra futuros diagnósticos via `journalctl`.

## O que NÃO muda

- `ocpp-standalone-server/server.js` — fixes anteriores (sweep skipping live CPs, pong-refresh) ficam. São primeira linha de defesa; só não dependemos exclusivamente deles.
- Tabelas existentes — sem schema novo.

## Por que isso resolve definitivamente

- DB pode "mentir" — o app/edge function sempre tem como confirmar via OCPP server direto.
- OCPP server pode reiniciar / quebrar pong-refresh — o cron de 60s reconcilia em 1 min.
- Único caso restante: charger fisicamente desconectado (igual agora). Aí a mensagem é acionável: "religar disjuntor" — não tem solução por software.

## Para resolver AGORA (estado atual)

Aplicaremos um `UPDATE` via migration imediato pra restaurar o 140515 enquanto o XIRU não reconecta — assim você abre o app e funciona. Quando o charger reconectar (manualmente religando o disjuntor desta vez), a infra nova mantém ele saudável dali pra frente.

## Validação pós-deploy

1. Migration aplicada → 140515 fica `Available` no DB.
2. Cron de 1 min começa a rodar → após religar o disjuntor, em ≤60s o status reflete realidade.
3. Encerrar uma sessão de teste → esperar 5 min → abrir app → continua online sem `UPDATE` manual.
4. Restart do Droplet → após o XIRU reconectar, em ≤60s o status volta sem intervenção.
