

## Corrigir erro: carregador aparece "Available" mas está desconectado

### Problema

O carregador `ZETA UNO VILLAGIO` tem `ocpp_protocol_status: Available` mas o `last_heartbeat` é de mais de 35 minutos atrás. O carregador não está de fato conectado via WebSocket. A Edge Function verifica apenas o `ocpp_protocol_status` na ação `start`, mas não verifica se o heartbeat é recente. Resultado: a sessão é criada, o `RemoteStartTransaction` falha porque o carregador não está online, a sessão é apagada, e o usuário vê "erro de função".

### Solução

Duas correções complementares:

**1. Edge Function (`charger-commands/index.ts`) -- verificar heartbeat na ação `start`**

Antes de aceitar o carregador como "disponível", verificar se o heartbeat foi recebido nos últimos 2 minutos (mesma lógica já usada na ação `status`):

```js
// Após a validação do ocpp_protocol_status (linha ~117)
const lastHeartbeat = charger.last_heartbeat ? new Date(charger.last_heartbeat) : null;
const isConnected = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) < 120000 : false;

if (!isConnected) {
  return new Response(JSON.stringify({ 
    error: 'Charger offline',
    message: 'O carregador não está respondendo. Verifique a conexão e tente novamente.'
  }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
```

**2. Hook `useChargerValidation.tsx` -- mensagens amigáveis para erros de conexão**

Adicionar tratamento para "Charger offline", "Remote start failed" e "not connected":

```js
if (errorMessage.includes('não está respondendo') || errorMessage.includes('offline') || errorMessage.includes('not connected')) {
  toast({ title: "Carregador offline", description: "O carregador não está respondendo. Tente novamente." });
}
```

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `supabase/functions/charger-commands/index.ts` | Adicionar verificação de heartbeat recente na ação `start`, antes de criar sessão |
| `src/hooks/useChargerValidation.tsx` | Melhorar mensagens de erro para cenários de carregador offline/desconectado |

