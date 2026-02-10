

# Corrigir handler do BootNotification no servidor OCPP

## Problema identificado

O wscat conecta com sucesso usando o ID `140414`, mas o servidor nao responde ao BootNotification. A conexao permanece aberta (o charger foi validado no banco), porem nenhuma resposta `[3, ...]` e devolvida.

A causa mais provavel: o `await supabase.update()` dentro de `handleBootNotification` esta falhando silenciosamente. O erro e capturado pelo `try/catch` generico no handler de mensagens, que apenas loga o erro no console do servidor -- mas nunca envia a resposta ao cliente.

## Solucao

Reorganizar o `handleBootNotification` (e os demais handlers) para garantir que a resposta OCPP seja **sempre enviada**, independentemente do sucesso ou falha da operacao no banco de dados.

## Alteracoes no arquivo `ocpp-standalone-server/server.js`

### 1. Corrigir `handleBootNotification`

Mover o `sendCallResult` para **antes** da operacao no banco, ou envolver o update em try/catch proprio garantindo que a resposta sempre seja enviada:

```javascript
async function handleBootNotification(ws, messageId, payload, chargePointId) {
  console.log(`[BootNotification] Processing for ${chargePointId}`, payload);

  // SEMPRE responder primeiro - o charger precisa da resposta
  sendCallResult(ws, messageId, {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300,
  });

  console.log(`[BootNotification] Accepted for ${chargePointId}`);

  // Atualizar banco em segundo plano (nao bloqueia a resposta)
  try {
    const { error } = await supabase
      .from('chargers')
      .update({
        ocpp_model: payload.chargePointModel || null,
        ocpp_vendor: payload.chargePointVendor || null,
        firmware_version: payload.firmwareVersion || null,
        serial_number: payload.chargePointSerialNumber || null,
        last_heartbeat: new Date().toISOString(),
        ocpp_protocol_status: 'Available',
        ocpp_error_code: null,
      })
      .eq('ocpp_charge_point_id', chargePointId);

    if (error) {
      console.error('[BootNotification] DB update error:', error);
    }
  } catch (dbError) {
    console.error('[BootNotification] DB exception:', dbError);
  }
}
```

### 2. Adicionar logging no handler de mensagens

Melhorar o `try/catch` principal para logar exatamente qual etapa falhou:

```javascript
ws.on('message', async (data) => {
  try {
    const raw = data.toString();
    console.log(`[OCPP Server] Raw message from ${chargePointId}:`, raw);
    const message = JSON.parse(raw);
    // ... rest of handler
  } catch (error) {
    console.error(`[OCPP Server] Error processing message:`, error.message);
    console.error(`[OCPP Server] Stack:`, error.stack);
  }
});
```

### 3. Aplicar o mesmo padrao nos demais handlers

Os handlers `handleStartTransaction`, `handleStopTransaction`, e `handleStatusNotification` tambem devem enviar a resposta OCPP antes de fazer operacoes no banco, ou pelo menos garantir que a resposta seja enviada em caso de erro.

## Resultado esperado

Apos o deploy:
1. `wscat` conecta com ID `140414`
2. Envia BootNotification
3. Recebe imediatamente: `[3,"test-001",{"status":"Accepted","currentTime":"...","interval":300}]`
4. Banco e atualizado em segundo plano

