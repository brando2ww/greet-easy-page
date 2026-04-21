Aqui está o plano final consolidado com os ajustes aplicados, pronto para copiar e colar no Lovable:

---

## Plano: cronômetro só começa quando energia flui de verdade

### Problema

Hoje `started_at` é setado em `Preparing` (plug conectado, sem energia). O cronômetro da UI usa essa base e começa antes da carga real, gerando falso "carregando".

### Decisão de design

**Sem migração de banco.** Usar `meter_start IS NOT NULL` como proxy do "primeiro MeterValues real recebido". O `StartTransaction` define `meter_start`, então o primeiro `MeterValues` subsequente é o gatilho perfeito para realinhar `started_at`.

---

### Mudanças

#### 1. `ocpp-standalone-server/server.js` — topo do arquivo

Declarar o Set global logo após `const pendingCalls = new Map()`:

```js
// Flag em memória: sessões que já tiveram started_at realinhado neste processo
const firstMeterRealigned = new Set();

```

---

#### 2. `ocpp-standalone-server/server.js` — `handleMeterValues`

Após o bloco que salva as linhas em `meter_values` e antes do bloco que atualiza `energy_consumed`, inserir:

```js
// Realinha started_at para o timestamp real do primeiro MeterValues
// Gate: meter_start !== null (prova que StartTransaction chegou)
// Sem gate de tempo fixo — meter_start existente é condição suficiente
if (
  sessionId &&
  session &&
  session.status === 'in_progress' &&
  session.meter_start !== null &&
  !firstMeterRealigned.has(sessionId)
) {
  const firstMeterTs = rows[0]?.timestamp ?? new Date().toISOString();
  await supabase
    .from('charging_sessions')
    .update({ started_at: firstMeterTs })
    .eq('id', sessionId);
  firstMeterRealigned.add(sessionId);
  console.log(`[OCPP] Realigned started_at for session ${sessionId} → ${firstMeterTs}`);
}

```

> **Atenção**: o objeto `session` já precisa incluir `meter_start` e `started_at` no select existente. Confirmar que o select está como:
>
> ```js
> .select('id, status, meter_start, started_at, chargers(price_per_kwh)')
>
> ```

---

#### 3. `ocpp-standalone-server/server.js` — `handleStopTransaction`

Após o update da sessão no banco, adicionar a limpeza da flag:

```js
// Limpa flag de realinhamento para este session.id
if (session?.id) {
  firstMeterRealigned.delete(session.id);
}

```

Isso garante que se o mesmo `session.id` for reutilizado (edge case), o realinhamento volta a funcionar.

---

#### 4. `src/pages/Carregamento.tsx` — cronômetro ancorado em `session.started_at`

Substituir a lógica local de `chargingStartRef` / `accumulatedRef` por:

```ts
// Cronômetro ancorado no started_at vindo do servidor
const elapsed = session?.started_at
  ? Math.floor((Date.now() - new Date(session.started_at).getTime()) / 1000)
  : 0;

```

Recalcular a cada segundo com `setInterval` enquanto `isActivelyCharging`.

Quando o servidor realinhar `started_at`, o próximo refetch (10s) atualiza automaticamente a âncora e o cronômetro salta para o tempo correto.

---

#### 5. `src/pages/Carregamento.tsx` — ocultar cronômetro até telemetria real

Mostrar `--:--:--` em vez de `00:00:00` enquanto o carregamento ainda não tem dados reais:

```ts
const showTimer = session?.meter_start !== null && 
  (session?.energy_consumed > 0 || session?.ocpp_protocol_status === 'Charging');

```

Se `showTimer` for `false`, renderizar `--:--:--` no lugar do cronômetro formatado.

---

### Fluxo completo esperado

1. Plug conectado → `Preparing` → sessão vira `in_progress`, `started_at` provisório, UI mostra **"Plugue detectado"**, cronômetro `--:--:--`
2. `StartTransaction` chega → `meter_start` setado, cronômetro ainda `--:--:--`
3. Primeiro `MeterValues` real → servidor realinha `started_at` para o timestamp da telemetria, UI faz refetch e cronômetro começa a partir de `00:00:00` no instante exato em que energia começou a fluir
4. Próximas leituras apenas atualizam `energy_consumed` / `cost` / `soc`, sem mexer em `started_at`

---

### O que NÃO mudar

- Sem coluna nova no banco
- Sem alterar a regra de transição `awaiting_plug → in_progress`
- Sem migration

---

### Arquivos afetados


| Arquivo                            | Mudança                                                                                                    |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `ocpp-standalone-server/server.js` | `firstMeterRealigned` Set global; realinhamento no `handleMeterValues`; cleanup no `handleStopTransaction` |
| `src/pages/Carregamento.tsx`       | Cronômetro ancorado em `session.started_at`; `showTimer` oculta `--:--:--` até telemetria real             |
