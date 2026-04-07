

## Suspender carregamento: emergência, saldo e internet

### Esclarecimento sobre o botão de emergência

O botão de emergência é **físico no carregador** -- quando pressionado, o carregador envia um `StatusNotification` com status `Faulted` (e possivelmente `errorCode: EmergencyStop`). O servidor OCPP precisa reagir a isso encerrando a sessão automaticamente.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `ocpp-standalone-server/server.js` | No handler `handleStatusNotification`, detectar status `Faulted` e encerrar sessão ativa automaticamente (enviar `RemoteStopTransaction` e marcar sessão como `completed` com `stop_reason: EmergencyStop`) |
| `src/pages/Carregamento.tsx` | Adicionar detecção de falta de internet (`navigator.onLine` + eventos `offline`/`online`) com parada automática após 15s offline; adicionar verificação de saldo insuficiente a cada poll |
| `src/hooks/useWalletBalance.tsx` | Adicionar `refetchInterval: 10000` para manter saldo atualizado durante carregamento |

### Detalhes

**1. Emergência (servidor OCPP)**

No `handleStatusNotification` (linha 323), quando `payload.status === 'Faulted'`:
- Buscar sessão ativa (`status: 'in_progress'`) para esse carregador
- Se existir, atualizar para `completed` com `stop_reason: 'EmergencyStop'`
- Logar o evento com o `errorCode` recebido

**2. Saldo insuficiente (frontend)**

- Importar `useWalletBalance` no `Carregamento.tsx`
- Adicionar `useEffect` que verifica: se `balance - estimatedCost < 1.00` e `isActivelyCharging`, chamar `handleStop()` e exibir toast "Saldo insuficiente"
- `useWalletBalance` passa a fazer refetch a cada 10s

**3. Falta de internet (frontend)**

- Adicionar `useEffect` com listeners `window.addEventListener('offline'/'online')`
- Ao ficar offline, iniciar timer de 15s
- Se não reconectar em 15s e `isActivelyCharging`, chamar `handleStop()`
- Exibir banner "Sem conexão" no topo quando offline
- Ao reconectar, cancelar timer

