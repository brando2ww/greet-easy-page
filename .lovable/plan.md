

## Eliminar necessidade do UPDATE manual após cada teste

### Diagnóstico

Você roda este UPDATE toda vez:
```sql
UPDATE chargers SET status='available', ocpp_protocol_status='Available', last_heartbeat=NOW()
WHERE ocpp_charge_point_id='140515';
```

Estado real do XIRU agora: `status=available, ocpp_protocol_status=Available, last_heartbeat=2.4 min atrás`. Ou seja, **o servidor ESTÁ atualizando** quando o carregador envia heartbeat/StatusNotification. O problema é quando algo ATRASA e o sweep agressivo marca offline antes do próximo heartbeat chegar.

Causas dos três campos ficarem "errados":

1. **`ocpp_protocol_status='Offline'`** ← causada pelo sweep em `server.js` linha 472-476: se `last_heartbeat > 3 min` marca Offline. **3 min é curto demais** — o intervalo OCPP padrão de heartbeat do XIRU é 4-5 min, e qualquer atraso de rede empurra pra cima de 3.
2. **`status='in_use'` travado** ← sessões antigas que terminaram mal (testes interrompidos, falha de RemoteStop, processo de teste matado). O servidor só reseta para `available` via mapeamento do StatusNotification quando o XIRU envia `Available`, mas se a sessão fica órfã o `chargers.status` segue `in_use`.
3. **`last_heartbeat` velho** ← consequência natural quando o XIRU desliga entre testes. Não é bug, mas o sweep age sobre isso.

### Mudanças propostas

#### 1. `ocpp-standalone-server/server.js` linha 448

```js
// ANTES
const STALE_HEARTBEAT_MS = 3 * 60_000; // 3 minutes

// DEPOIS
const STALE_HEARTBEAT_MS = 10 * 60_000; // 10 minutes
```

A camada primária de detecção de zumbi continua sendo o **ping/pong WebSocket de 30s** (linhas ~440-460), que é instantâneo e confiável. O sweep de heartbeat é só defesa em profundidade — 10 min é folga suficiente pro intervalo de heartbeat do XIRU + variação de rede, sem perder a função de limpar conexões realmente mortas.

#### 2. Auto-fix do `chargers.status` órfão (sem mudança de código necessária — já existe!)

O `charger-commands/index.ts` linhas 75-95 e 295-310 **já tem** lógica de auto-fix: quando você tenta iniciar carga ou consulta status, se `chargers.status='in_use'` mas não há sessão ativa, ele zera para `available`. Isso significa que o `status='in_use'` travado se conserta sozinho na próxima tentativa — você não precisa do SQL pra isso.

Se mesmo assim quiser forçar limpeza periódica (ex.: 1x por minuto sem precisar de tentativa do app), podemos adicionar no sweep do `server.js` (linhas ~470-480) um update extra:

```js
// Reset chargers.status to 'available' when no active session exists
await supabase.rpc('reset_orphan_charger_status'); // ou inline SQL
```

Mas honestamente, dado que o auto-fix já roda no fluxo crítico (start/status), **isso é opcional**. Recomendo só fazer a mudança #1 e ver se o problema some.

### Resumo da mudança

| Arquivo | Linha | Mudança |
|---|---|---|
| `ocpp-standalone-server/server.js` | 448 | `STALE_HEARTBEAT_MS`: 3 min → 10 min |

Mudança de uma linha. Baixíssimo risco. Mantém detecção rápida (ping/pong 30s) intacta.

### Atualização de memória

Atualizar `mem://decisoes-tecnicas/deteccao-conexao-zumbi-ocpp` para refletir os novos 10 min.

### Validação pós-deploy

1. SSH no Droplet: `git pull && systemctl restart ocpp-server`.
2. Fazer um teste, encerrar a carga, esperar 4-5 min sem mexer.
3. Conferir no banco: `ocpp_protocol_status` deve seguir `Available` (não cair pra `Offline`).
4. Próximo teste deve iniciar sem precisar do UPDATE manual.

Confirma a aplicação?

