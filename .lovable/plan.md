

## Plano: investigar por que XIRU não envia `StartTransaction` mesmo com cabo plugado

## Estado confirmado

- Cabo plugado no carro **agora**.
- Servidor recebeu `RemoteStartTransaction` e respondeu `success: true` (logs Edge Function 16:36:20).
- Sessão `58986af6...` continua `awaiting_plug`, `transaction_id` NULL.
- Zero `meter_values`. Zero `StartTransaction`. Zero `StatusNotification(Preparing/Charging)` chegou ao servidor desde o RemoteStart.
- `ocpp_protocol_status` ainda `Available` — o XIRU **não está reportando que detectou o plug**.

Isto não é problema de software nosso — o XIRU está silencioso após o RemoteStart. Precisamos de visibilidade direta no que ele envia (ou não envia) via WebSocket para diagnosticar.

## O que fazer (modo default)

### 1. Adicionar logging detalhado e endpoints de diagnóstico no servidor OCPP

Em `ocpp-standalone-server/server.js`:

- **Buffer em memória** com últimas 500 mensagens OCPP por charge point: `{ timestamp, direction (in/out), action, payload }`.
- Logar **toda** mensagem que chega de cada CP, antes de qualquer handler — assim vemos se XIRU sequer envia algo.
- **Endpoint `GET /admin/messages?cp=140515&limit=100`** protegido por header `x-internal-key`.
- **Endpoint `GET /admin/active-connections`** mostrando CPs conectados e tempo do último frame recebido.

### 2. Adicionar endpoint `TriggerMessage` para forçar XIRU a falar

Carregadores OCPP 1.6 suportam o comando `TriggerMessage` que força o CP a reenviar `StatusNotification`, `MeterValues` ou `Heartbeat`. Útil para destravar firmwares preguiçosos.

- Em `server.js`: novo endpoint `POST /api/trigger-message` recebendo `{ chargePointId, requestedMessage, connectorId }`.
- Suportar `requestedMessage`: `StatusNotification`, `MeterValues`, `BootNotification`.

### 3. Edge Function `ocpp-diagnostics`

Nova `supabase/functions/ocpp-diagnostics/index.ts`:

- Valida JWT + role admin via `has_role`.
- Faz proxy para os endpoints do servidor OCPP usando `OCPP_INTERNAL_KEY`.
- Actions suportadas: `messages`, `connections`, `trigger`.
- Registrar em `supabase/config.toml` com `verify_jwt = false` (validação manual interna).

### 4. Aplicar `TriggerMessage(StatusNotification)` agora no XIRU

Após deploy, eu chamo `ocpp-diagnostics` com action `trigger` para forçar o XIRU a enviar o status atual do conector. Cenários:

| Resposta XIRU | Significado | Ação |
|---|---|---|
| `Available` | Cabo plugado mas firmware não detectou | Bug do firmware; testar `connectorId: 0` no RemoteStart |
| `Preparing` | Cabo detectado, esperando autorização | Reenviar `Authorize` ou ajustar `idTag` |
| `Charging` | Já está carregando, só não notificou | Bug servidor — não processou `StatusNotification` anterior |
| `Faulted` + errorCode | Falha física | Mostrar erro ao usuário no app |
| Sem resposta | XIRU travado ou WebSocket morto silenciosamente | Reiniciar fisicamente o XIRU |

### 5. Ajustar UI para timeout em `awaiting_plug`

Em `src/pages/Carregamento.tsx`:

- Após **90 segundos** em `awaiting_plug` sem progresso, mostrar alerta: "Carregador não detectou o plug. Verifique o cabo ou cancele a sessão."
- Botão "Cancelar e tentar novamente" que chama `commandsApi.stopCharge` e volta para Estações.
- Botão "Forçar verificação" que chama nova action `triggerStatus` na Edge Function `charger-commands` (usa o `ocpp-diagnostics`).

### 6. Documentar deploy manual no Droplet

Após o código ser commitado, **você precisa rodar no servidor**:

```text
ssh root@68.183.152.189
cd /opt/ocpp-server && git pull
systemctl restart ocpp-server
journalctl -u ocpp-server -f
```

A Edge Function deploya sozinha.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `ocpp-standalone-server/server.js` | + buffer de mensagens, endpoints `/admin/messages`, `/admin/active-connections`, `/api/trigger-message` |
| `supabase/functions/ocpp-diagnostics/index.ts` | nova função (proxy + auth admin) |
| `supabase/functions/charger-commands/index.ts` | + action `triggerStatus` |
| `supabase/config.toml` | + entrada `[functions.ocpp-diagnostics]` |
| `src/services/api.ts` | + `commandsApi.triggerStatus()` |
| `src/pages/Carregamento.tsx` | + timeout 90s, alerta, botões cancelar/forçar |

## O que não vou mexer agora

- Lógica do `ZETA UNO` (que funciona) — todas as adições são novas/aditivas, sem alterar handlers existentes.
- RLS, banco, secrets — todos já configurados.
- Subprotocolo OCPP — XIRU já conecta, problema é pós-conexão.

## Próximos passos após implementação

1. Você roda `git pull` + `systemctl restart` no Droplet.
2. Eu chamo `ocpp-diagnostics?action=messages&cp=140515` e mostro tudo que XIRU enviou nos últimos minutos.
3. Eu chamo `trigger` para forçar `StatusNotification` e vemos a resposta real.
4. Conforme resultado da tabela acima, aplicamos correção específica (provavelmente `connectorId: 0` ou reset físico).

