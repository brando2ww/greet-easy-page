

## Diagnóstico: o bug está no `server.js`, não no edge function

### Evidência cruzada dos logs

**Servidor OCPP (13:19:39):**
```text
Raw message from 140515: [3,"remote-start-1776863979549",{"status":"Accepted"}]
Received CALLRESULT from 140515: undefined          ← payload veio undefined!
```

**Edge function (mesma sequência):**
```text
Remote start result: { success: false, status: "Unknown", message: "RemoteStartTransaction Unknown by charger" }
Session marked cancelled (RemoteStart rejected)
```

O XIRU **realmente** respondeu `Accepted`. O servidor recebeu a mensagem bruta correta. Mas extraiu `payload = undefined` antes de resolver a Promise. Por isso o `/api/remote-start` retorna `success: false, status: "Unknown"` — e o edge function, agindo corretamente sobre essa resposta, cancela a sessão.

### Causa raiz exata (server.js linha 545)

```js
const [messageType, messageId, action, payload] = message;
```

Esse destructuring assume **sempre 4 elementos** (formato CALL: `[2, id, action, payload]`).

Mas CALLRESULT tem **3 elementos**: `[3, id, payload]`.

Resultado:
- `action` recebe `{status: "Accepted"}` (o payload real)
- `payload` recebe `undefined`

Aí na linha 587:
```js
pending.resolve(payload);   // resolve com undefined
```

E o handler do `/api/remote-start` (linha 147) faz `result?.status || 'Unknown'` → cai no fallback.

### Por que o edge function NÃO é o problema

Na linha 198 do `charger-commands/index.ts`:
```ts
if (!remoteResult.success) { ... cancel ... }
```

Está correto. O servidor enviou literalmente `success: false`, então o cancelamento é o comportamento certo dado o input. Adicionar mais logs no edge function não muda nada — o defeito está upstream.

### Conflito com a restrição "não mexer no server.js"

A última instrução foi "não mexer no server.js, versão em produção está estável". Mas a versão em produção **não está estável** para este caso: ela aceita o CALLRESULT do XIRU, registra `Received CALLRESULT: undefined`, e responde `success: false` ao edge function. Toda tentativa real de iniciar carga vai falhar até isso ser corrigido.

A correção é mínima e cirúrgica:

```js
// ANTES (linha 545)
const [messageType, messageId, action, payload] = message;

// DEPOIS
const messageType = message[0];
const messageId   = message[1];
let action, payload;
if (messageType === 2) {        // CALL: [2, id, action, payload]
  action  = message[2];
  payload = message[3];
} else {                        // CALLRESULT [3, id, payload] / CALLERROR [4, id, errCode, errDesc, errDetails]
  payload = message[2];
}
```

Nada mais muda. O `recordMessage` (linhas 547-552) já trata `messageType !== 2` separadamente e continua funcionando. Os handlers de CALL (`switch(action)`) só rodam quando `messageType === 2`, onde `action` está corretamente populado.

### Decisão necessária do usuário

| Opção | Consequência |
|---|---|
| **A. Corrigir `server.js`** (recomendado) | Resolve o bug de fato. Exige redeploy manual no Droplet (`git pull && systemctl restart ocpp-server`). Mudança de 8 linhas, baixo risco. |
| **B. Não tocar no `server.js`** | Bug permanece. Toda sessão será cancelada com `RemoteStart Unknown` mesmo o XIRU aceitando. |
| **C. Workaround no edge function** | Tratar `status: 'Unknown'` como sucesso? **Não recomendado**: mascararia falhas reais e quebraria o tratamento de `Rejected`/`Timeout` legítimos. |

### Arquivo afetado (Opção A)

| Arquivo | Mudança |
|---|---|
| `ocpp-standalone-server/server.js` linha 545 | Destructuring condicional por `messageType` (CALL vs CALLRESULT/CALLERROR) |

### Validação pós-deploy

1. SSH no Droplet, `git pull && systemctl restart ocpp-server`.
2. Iniciar sessão pelo app.
3. Log esperado no servidor: `Received CALLRESULT from 140515: { status: 'Accepted' }` (não mais `undefined`).
4. Log esperado no edge function: `Remote start result: { success: true, status: "Accepted", ... }`.
5. `charging_sessions` mantém registro com `status = 'awaiting_plug'` até o plug conectar.

**Confirme se posso aplicar a Opção A.**

