## Acabar com o "Estação offline" toda manhã

### Diagnóstico (nova hipótese — diferente das anteriores)

Aumentamos `STALE_HEARTBEAT_MS` de 3 → 10 min, mas o problema persiste porque **a causa raiz não é o tamanho da janela**. É que o servidor tem duas fontes independentes de "vida" do carregador, e elas não se conversam:

| Camada | Atualiza | Quando |
|---|---|---|
| OCPP Heartbeat (`handleHeartbeat`) | `chargers.last_heartbeat` | a cada ~5 min (intervalo default do XIRU) |
| WebSocket ping/pong (30s) | só `ws.isAlive` em memória | a cada 30s |

Quando o app fica fechado uma noite, o XIRU continua com a WebSocket viva (ping/pong rodando, `ws.isAlive=true`), mas se demora >10 min para enviar o próximo OCPP Heartbeat, o **stale-heartbeat sweep marca como `Offline`** mesmo com a WebSocket perfeitamente conectada. Daí o app abre de manhã e mostra "Estação offline".

Evidência: screenshot mostra `"Esta estação não está conectada. Tente outra."` — texto exato do `useChargerValidation` quando `ocpp_protocol_status !== 'Available'/'Preparing'`. Ou seja, o banco tem `Offline` enquanto o WebSocket está vivo.

Há ainda um agravante: mesmo se o sweep não marcasse Offline, o frontend valida `last_heartbeat < 2 min` (`useChargerValidation.tsx` linha 61). Com Heartbeat OCPP a cada 5 min, qualquer consulta nos minutos 2-5 do ciclo já falha.

### Mudanças

#### 1. `ocpp-standalone-server/server.js` — sweep só age em CPs SEM WebSocket viva (linhas 470-488)

```js
const staleHeartbeatSweep = setInterval(async () => {
  try {
    const aliveCps = Array.from(activeConnections.keys());
    const cutoff = new Date(Date.now() - STALE_HEARTBEAT_MS).toISOString();
    let q = supabase
      .from('chargers')
      .update({ ocpp_protocol_status: 'Offline' })
      .neq('ocpp_protocol_status', 'Offline')
      .lt('last_heartbeat', cutoff);
    if (aliveCps.length > 0) {
      q = q.not('ocpp_charge_point_id', 'in', `(${aliveCps.map(id => `"${id}"`).join(',')})`);
    }
    const { data, error } = await q.select('id, ocpp_charge_point_id');
    // ... log igual
  } ...
}, 60_000);
```

WebSocket viva = não é zumbi, ponto. O ping/pong de 30s já é a fonte de verdade pra detectar morte real.

#### 2. `ocpp-standalone-server/server.js` — atualizar `last_heartbeat` no pong (linha 501)

Quando recebemos pong, refrescar `last_heartbeat` no banco (throttled — uma vez a cada 60s por CP) para o frontend nunca ver "sem sinal" enquanto a WebSocket está viva:

```js
const lastDbHeartbeatPush = new Map(); // cpId -> timestamp do último update
ws.on('pong', () => {
  ws.isAlive = true;
  const now = Date.now();
  const last = lastDbHeartbeatPush.get(chargePointId) || 0;
  if (now - last > 60_000) {
    lastDbHeartbeatPush.set(chargePointId, now);
    supabase
      .from('chargers')
      .update({ last_heartbeat: new Date().toISOString(), ocpp_protocol_status: 'Available' })
      .eq('ocpp_charge_point_id', chargePointId)
      .is('ocpp_protocol_status', null) // não tocar se está em Charging/Preparing/etc
      .then(() => {}, () => {});
  }
});
```

Correção: o filtro `.is(... null)` está errado — quero refrescar `last_heartbeat` SEMPRE, mas só promover `ocpp_protocol_status` para `Available` se estiver `Offline` (não sobrescrever Charging/Preparing). Versão correta:

```js
ws.on('pong', () => {
  ws.isAlive = true;
  const now = Date.now();
  const last = lastDbHeartbeatPush.get(chargePointId) || 0;
  if (now - last > 60_000) {
    lastDbHeartbeatPush.set(chargePointId, now);
    // Refresh heartbeat sempre
    supabase.from('chargers')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('ocpp_charge_point_id', chargePointId)
      .then(() => {}, () => {});
    // Promover Offline → Available (não toca Charging/Preparing/etc)
    supabase.from('chargers')
      .update({ ocpp_protocol_status: 'Available' })
      .eq('ocpp_charge_point_id', chargePointId)
      .eq('ocpp_protocol_status', 'Offline')
      .then(() => {}, () => {});
  }
});
```

Com isso, mesmo sem o XIRU emitir OCPP Heartbeat, o `last_heartbeat` no banco é refrescado a cada 60s enquanto a WebSocket estiver viva. E se em algum momento ele caiu pra Offline incorretamente (sweep antigo, race no boot), o pong promove de volta.

#### 3. `src/hooks/useChargerValidation.tsx` — relaxar a janela de 2 min (linha 61)

A janela de 2 min é muito agressiva. O OCPP Heartbeat default do XIRU é 5 min. Subir para 10 min:

```ts
const isConnected = ageMs < 600_000; // 10 minutos
```

E ajustar a mensagem proporcional. Como o item #2 já vai refrescar `last_heartbeat` a cada 60s pelo pong, na prática essa janela quase nunca será atingida — mas mantém defesa em profundidade.

### O que NÃO muda

- `STALE_HEARTBEAT_MS = 10 min` — fica como está.
- Lógica de OCPP Heartbeat / StatusNotification — intactas.
- Edge function `charger-commands` — intacta (ela já valida 2 min, mas isso só afeta o momento de iniciar carga; com o pong refrescando a cada 60s, sempre passa).

### Por que isso resolve definitivamente

- WebSocket viva → pong a cada 30s → `last_heartbeat` no DB sempre <60s → sweep nunca marca Offline.
- WebSocket morre → ping/pong falha em 1 ciclo → `ws.terminate()` + DB `Offline` (linha 452-460, já existe).
- Carregador desliga → WebSocket cai → mesmo caminho acima.
- Não tem mais necessidade do `UPDATE` manual.

### Validação pós-deploy

1. SSH no Droplet: `git pull && systemctl restart ocpp-server`.
2. `journalctl -u ocpp-server -f` — observar pongs chegando do XIRU a cada 30s.
3. Conferir no banco a cada 1-2 min: `SELECT ocpp_charge_point_id, last_heartbeat, ocpp_protocol_status FROM chargers WHERE ocpp_charge_point_id='140515';` — `last_heartbeat` deve avançar a cada ~60s, `ocpp_protocol_status` ficar `Available`.
4. Fechar o app por horas, reabrir → estação deve aparecer online sem UPDATE manual.

Confirma aplicação?
