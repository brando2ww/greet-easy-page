

## Plano: detectar conexão zumbi e forçar reconexão do XIRU

### Diagnóstico atual

| Campo | Valor |
|---|---|
| `ocpp_protocol_status` | `Charging` (stale, do último evento real) |
| `last_heartbeat` | 17:16:16 — **58 minutos atrás** |
| `status` | `available` |

A UI mostra "Carregador offline" corretamente (heartbeat > 2min), mas o servidor OCPP achou que ainda estava conectado e **não limpou o status** quando a WebSocket morreu silenciosamente. O XIRU provavelmente também acha que continua conectado e nunca tentará reconectar até reboot físico.

A causa raiz é a **falta de ping/pong WebSocket** no servidor. Sem isso:
- TCP keepalive do kernel só dispara após ~2h.
- Servidor mantém socket morto eternamente.
- XIRU não percebe que o servidor parou de receber.
- Único jeito de recuperar é reboot manual do carregador.

## O que vou fazer

### 1. Servidor OCPP — heartbeat WebSocket ping/pong

Em `ocpp-standalone-server/server.js`:

- A cada **30s**, enviar `ws.ping()` para todos os clientes conectados.
- Marcar `ws.isAlive = false` antes do ping.
- Ao receber `pong`, marcar `ws.isAlive = true`.
- No próximo ciclo, se `ws.isAlive === false`: chamar `ws.terminate()` (fecha socket morto imediatamente).
- Quando socket fecha por terminate, disparar a limpeza no banco:
  - `ocpp_protocol_status = 'Offline'`
  - Não muda `status` (mantém `available` se não houver sessão ativa).
- Log claro: `[OCPP] Terminated zombie connection: ${chargePointId}`.

### 2. Servidor OCPP — auto-marcar offline por heartbeat stale (defesa em profundidade)

Setinterval a cada **60s** roda no servidor:

- Busca chargers com `ocpp_protocol_status != 'Offline'` e `last_heartbeat < now() - 3 min`.
- Marca `ocpp_protocol_status = 'Offline'`.
- Garante que o frontend reflita o estado real mesmo se o ping/pong falhar.

### 3. Frontend — mensagem de erro mais útil

Em `src/hooks/useChargerValidation.tsx`, quando heartbeat stale, mostrar instrução acionável em vez de só "offline":

```text
Carregador sem resposta
O ELETROPOSTO XIRU não envia sinal há X minutos.
Vá até o carregador e:
1. Desligue e religue o disjuntor
2. Aguarde 30 segundos
3. Tente novamente
```

Isso transforma erro em ação concreta para o usuário no local.

### 4. Limpeza imediata do estado atual

Marcar o XIRU como `Offline` agora via migration one-shot para refletir a realidade até o reboot:

```sql
UPDATE chargers
SET ocpp_protocol_status = 'Offline'
WHERE id = 'cdbaf312-807c-4bb8-a7ed-90e3fef7565f'
  AND last_heartbeat < now() - interval '3 minutes';
```

### 5. Documentar a regra de detecção

Adicionar em `mem://decisoes-tecnicas/deteccao-conexao-zumbi-ocpp` registrando a regra: ping a cada 30s, terminate em pong perdido, sweep de 60s para heartbeat > 3min.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `ocpp-standalone-server/server.js` | Ping/pong 30s com terminate em zombie; sweep 60s para auto-offline; cleanup do banco no close |
| `src/hooks/useChargerValidation.tsx` | Mensagem de erro acionável quando heartbeat stale |
| Migration | Marcar XIRU atual como Offline |
| Memória | Registrar regra de detecção de zombie |

## O que NÃO vou fazer

- Não adiciono basic auth WebSocket.
- Não persisto contadores ou outros itens do hardening completo — apenas o que destrava o problema atual de zombie.
- Não toco na lógica `awaiting_plug → in_progress` (já está correta).

## Ação manual imediata

Para destravar o XIRU **agora**, antes do deploy:
1. Desligue o disjuntor do ELETROPOSTO XIRU.
2. Aguarde 30 segundos.
3. Religue.
4. Aguarde 60s para reconectar via WebSocket.
5. Tente iniciar pelo app.

## Deploy do servidor após o commit

```text
ssh root@68.183.152.189
cd /opt/ocpp-server && git pull
systemctl restart ocpp-server
journalctl -u ocpp-server -f | grep -E 'ping|pong|zombie|Terminated'
```

## Resultado esperado

- Conexões mortas detectadas em ≤60s, não mais ≤2h.
- XIRU forçado a reconectar quando socket cair.
- Frontend mostra status real, com instrução prática de reset físico se necessário.
- Próxima carga real vira `in_progress` apenas quando `StartTransaction`/`MeterValues` chegar (mantém regra correta).

