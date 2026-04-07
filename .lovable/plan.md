

## Pausar timer de duração enquanto aguarda plugue

### Problema
O contador de duração inicia imediatamente ao entrar na tela, mesmo quando o status OCPP é "Available" ou "Preparing" (aguardando plugue). O timer só deveria começar quando o plugue for conectado (status "Charging").

### Solução

**Arquivo**: `src/pages/Carregamento.tsx`

1. **Condicionar o timer ao status OCPP**: Modificar o `useEffect` do timer (linhas 68-75) para só contar quando `ocppStatus === "Charging"` (ou outros status ativos como `SuspendedEV`, `SuspendedEVSE`).

2. **Lógica**:
   - Criar uma flag `isActivelyCharging` baseada no `ocppStatus` — `true` para `Charging`, `SuspendedEV`, `SuspendedEVSE`, `Finishing`
   - Quando `isActivelyCharging` é `false`, o timer fica parado em `00:00:00`
   - Quando muda para `true`, registrar o momento de início real da contagem
   - Usar um `useRef` para acumular o tempo já decorrido quando houver pausas/retomadas

3. **Exibição**: Enquanto aguarda plugue, mostrar `00:00:00` fixo na duração.

| Arquivo | Mudança |
|---------|---------|
| `src/pages/Carregamento.tsx` | Adicionar `useRef` para tempo acumulado; condicionar timer ao `ocppStatus` ativo; parar contagem em status de espera |

