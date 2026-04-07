

## Garantir que carregador volte a "available" em todas as situações de parada

### Problema
Quando o carregamento para por emergência (status `Faulted`), o `statusMap` no servidor OCPP define o carregador como `unavailable`. Após encerrar a sessão, o status não é resetado para `available`. Nos outros cenários (parada pelo app, saldo, internet), a Edge Function já reseta para `available`, mas há um risco de falha silenciosa.

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `ocpp-standalone-server/server.js` | No bloco de emergência (linha ~393), após fechar a sessão, chamar `updateChargerStatus(chargePointId, 'available', 'Available')` para resetar o carregador |
| `supabase/functions/charger-commands/index.ts` | No caso `stop`, adicionar tratamento de erro mais robusto -- se o `RemoteStopTransaction` falhar, ainda assim marcar o charger como `available` (atualmente, se o remote stop falha, retorna erro sem resetar o status) |
| `src/pages/Carregamento.tsx` | Nos auto-stops (saldo e internet), se `handleStop()` falhar, forçar uma chamada direta para resetar o status do carregador via API |

### Detalhes

**1. Servidor OCPP -- emergência**
Após o bloco que fecha a sessão (`EmergencyStop`, linha 393), adicionar:
```
await updateChargerStatus(chargePointId, 'available', 'Available');
```

**2. Edge Function -- falha no remote stop**
Na ação `stop` (linha ~210 do charger-commands), quando `remoteResult.success === false`, em vez de retornar erro imediatamente, ainda atualizar o charger para `available` e a sessão para `completed`, pois o objetivo é garantir que nunca fique travado em `in_use`.

**3. Frontend -- fallback**
No `handleStop` do `Carregamento.tsx`, no bloco `catch` e quando `res.error`, adicionar uma tentativa extra de resetar o status via `commandsApi.getStatus(chargerId)` que já faz auto-fix de status stale (existente na edge function `status` action).

