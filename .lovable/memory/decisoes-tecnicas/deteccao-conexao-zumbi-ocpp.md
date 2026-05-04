---
name: Detecção de conexão zumbi OCPP
description: Servidor OCPP usa ping/pong WebSocket a cada 30s e sweep de 60s (janela de 10 min) para detectar e marcar carregadores como Offline quando a WebSocket morre silenciosamente
type: feature
---

Para evitar conexões "zumbi" — sockets WebSocket mortos que o kernel só
detectaria após ~2h de TCP keepalive — o servidor OCPP em
`ocpp-standalone-server/server.js` aplica duas camadas de detecção:

1. **Ping/pong WebSocket (30s) — camada primária**: a cada ciclo, marca
   `ws.isAlive = false` antes de enviar `ws.ping()`. O handler
   `ws.on('pong')` reseta para `true`. Se no ciclo seguinte ainda
   estiver `false`, o servidor chama `ws.terminate()`, remove de
   `activeConnections` e atualiza
   `chargers.ocpp_protocol_status = 'Offline'` (sem alterar o `status`
   operacional). Esta é a detecção rápida e confiável.

2. **Sweep por heartbeat stale (60s, janela de 10 min) — defesa em
   profundidade**: marca como `Offline` qualquer charger cujo
   `last_heartbeat` esteja há mais de `STALE_HEARTBEAT_MS = 10 * 60_000`
   e que ainda não esteja `Offline`. A janela de 10 min é folgada o
   suficiente para acomodar o intervalo padrão de heartbeat OCPP (4-5
   min em chargers como o XIRU) mais variação de rede, evitando falsos
   positivos. A detecção rápida real continua sendo o ping/pong de 30s.

O frontend (`useChargerValidation`) considera o carregador offline
quando o último heartbeat tem mais de 2 min, e mostra mensagem
acionável instruindo o usuário a desligar/religar o disjuntor.
