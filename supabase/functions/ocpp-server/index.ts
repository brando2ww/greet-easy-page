import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Mapear conexões WebSocket ativas por Charge Point ID
const activeConnections = new Map<string, WebSocket>();

// Contador de transações
let transactionIdCounter = 1000;

Deno.serve(async (req) => {
  // Extrair o Charge Point ID da URL
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  const chargePointId = pathParts[pathParts.length - 1]; // Último segmento da URL
  
  console.log(`[OCPP Server] Connection attempt from Charge Point ID: ${chargePointId}`);
  console.log(`[OCPP Server] Full URL: ${req.url}`);
  console.log(`[OCPP Server] Path: ${url.pathname}`);

  // Validar se o carregador existe no banco ANTES de aceitar a conexão WebSocket
  const { data: charger, error: chargerError } = await supabase
    .from('chargers')
    .select('id, name, ocpp_charge_point_id')
    .eq('ocpp_charge_point_id', chargePointId)
    .maybeSingle();

  if (chargerError) {
    console.error('[OCPP Server] Database error while validating charger:', chargerError);
    return new Response(
      JSON.stringify({ error: 'Database error', details: chargerError.message }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  if (!charger) {
    console.error(`[OCPP Server] Charge Point ${chargePointId} not registered in database`);
    return new Response(
      JSON.stringify({ 
        error: 'Charger not registered', 
        chargePointId: chargePointId,
        message: 'This charger is not registered in the system. Please register it first.'
      }),
      { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  console.log(`[OCPP Server] Charger validated: ${charger.name} (ID: ${charger.id})`);

  const { headers } = req;
  const upgradeHeader = headers.get('upgrade') || '';

  if (upgradeHeader.toLowerCase() !== 'websocket') {
    return new Response('Expected WebSocket connection', { status: 400 });
  }

  const { socket, response } = Deno.upgradeWebSocket(req);
  let heartbeatInterval: number | null = null;

  socket.onopen = () => {
    console.log('[OCPP Server] New connection established');
  };

  socket.onmessage = async (event) => {
    try {
      console.log('[OCPP Server] Received message:', event.data);
      const data = JSON.parse(event.data);
      
      const [messageTypeId, messageId, action, payload] = data;

      // CALL message from charger (messageTypeId = 2)
      if (messageTypeId === 2) {
        console.log(`[OCPP] Action: ${action}, Payload:`, payload);

        switch (action) {
          case 'BootNotification':
            await handleBootNotification(socket, messageId, payload);
            break;

          case 'Heartbeat':
            await handleHeartbeat(socket, messageId);
            break;

          case 'StatusNotification':
            await handleStatusNotification(socket, messageId, payload);
            break;

          case 'Authorize':
            await handleAuthorize(socket, messageId, payload);
            break;

          case 'StartTransaction':
            await handleStartTransaction(socket, messageId, payload);
            break;

          case 'StopTransaction':
            await handleStopTransaction(socket, messageId, payload);
            break;

          case 'MeterValues':
            await handleMeterValues(socket, messageId, payload);
            break;

          default:
            console.log(`[OCPP] Unknown action: ${action}`);
            sendCallError(socket, messageId, 'NotSupported', `Action ${action} not supported`);
        }
      }

      // CALLRESULT message from charger (messageTypeId = 3)
      if (messageTypeId === 3) {
        console.log(`[OCPP] CALLRESULT for messageId ${messageId}:`, payload);
      }

      // CALLERROR message from charger (messageTypeId = 4)
      if (messageTypeId === 4) {
        console.log(`[OCPP] CALLERROR for messageId ${messageId}:`, payload);
      }
    } catch (error) {
      console.error('[OCPP Server] Error processing message:', error);
    }
  };

  socket.onerror = (error) => {
    console.error('[OCPP Server] WebSocket error:', error);
  };

  socket.onclose = () => {
    console.log(`[OCPP Server] Connection closed for Charge Point: ${chargePointId}`);
    if (chargePointId) {
      activeConnections.delete(chargePointId);
      updateChargerStatus(chargePointId, 'Offline');
    }
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }
  };

  // Handlers para cada tipo de mensagem OCPP

  async function handleBootNotification(ws: WebSocket, messageId: string, payload: any) {
    // O chargePointId já foi validado e está disponível no escopo superior
    console.log(`[BootNotification] Processing for Charge Point ID: ${chargePointId}`);
    console.log(`[BootNotification] Payload:`, payload);

    // Atualizar informações do carregador
    await supabase
      .from('chargers')
      .update({
        ocpp_vendor: payload.chargePointVendor,
        ocpp_model: payload.chargePointModel,
        firmware_version: payload.firmwareVersion,
        ocpp_protocol_status: 'Available',
        last_heartbeat: new Date().toISOString(),
      })
      .eq('ocpp_charge_point_id', chargePointId);

    // Registrar conexão ativa
    activeConnections.set(chargePointId, ws);

    // Responder com sucesso
    sendCallResult(ws, messageId, {
      status: 'Accepted',
      currentTime: new Date().toISOString(),
      interval: 60, // Heartbeat a cada 60 segundos
    });

    console.log(`[BootNotification] Charge Point ${chargePointId} accepted`);
  }

  async function handleHeartbeat(ws: WebSocket, messageId: string) {
    console.log(`[Heartbeat] from ${chargePointId}`);

    // Atualizar timestamp do último heartbeat
    await supabase
      .from('chargers')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('ocpp_charge_point_id', chargePointId);

    sendCallResult(ws, messageId, {
      currentTime: new Date().toISOString(),
    });
  }

  async function handleStatusNotification(ws: WebSocket, messageId: string, payload: any) {
    const { status, errorCode, connectorId } = payload;
    console.log(`[StatusNotification] Connector ${connectorId}: ${status}, Error: ${errorCode}`);

    // Mapear status OCPP para status interno
    let internalStatus = 'available';
    if (status === 'Charging') internalStatus = 'in_use';
    if (status === 'Faulted' || status === 'Unavailable') internalStatus = 'maintenance';

    // Atualizar status no banco
    await supabase
      .from('chargers')
      .update({
        ocpp_protocol_status: status,
        ocpp_error_code: errorCode !== 'NoError' ? errorCode : null,
        status: internalStatus,
      })
      .eq('ocpp_charge_point_id', chargePointId);

    sendCallResult(ws, messageId, {});
  }

  async function handleAuthorize(ws: WebSocket, messageId: string, payload: any) {
    const { idTag } = payload;
    console.log(`[Authorize] ID Tag: ${idTag}`);

    // Por enquanto, aceitar todas as autorizações
    // Em produção, verificar contra banco de usuários autorizados
    sendCallResult(ws, messageId, {
      idTagInfo: {
        status: 'Accepted',
      },
    });
  }

  async function handleStartTransaction(ws: WebSocket, messageId: string, payload: any) {
    const { connectorId, idTag, meterStart, timestamp } = payload;
    console.log(`[StartTransaction] Connector: ${connectorId}, Tag: ${idTag}, Meter: ${meterStart}`);

    // Buscar o carregador
    const { data: charger } = await supabase
      .from('chargers')
      .select('id, price_per_kwh')
      .eq('ocpp_charge_point_id', chargePointId)
      .single();

    if (!charger) {
      sendCallError(ws, messageId, 'InternalError', 'Charger not found');
      return;
    }

    // Gerar ID de transação único
    const transactionId = transactionIdCounter++;

    // Criar sessão de carga no banco
    const { error } = await supabase
      .from('charging_sessions')
      .insert({
        charger_id: charger.id,
        user_id: '00000000-0000-0000-0000-000000000000', // Temporário - integrar com sistema de usuários
        transaction_id: transactionId,
        meter_start: meterStart,
        id_tag: idTag,
        started_at: timestamp || new Date().toISOString(),
        status: 'in_progress',
      });

    if (error) {
      console.error('[StartTransaction] Database error:', error);
      sendCallError(ws, messageId, 'InternalError', 'Failed to create session');
      return;
    }

    // Atualizar status do carregador
    await supabase
      .from('chargers')
      .update({
        status: 'in_use',
        ocpp_protocol_status: 'Charging',
      })
      .eq('id', charger.id);

    sendCallResult(ws, messageId, {
      transactionId,
      idTagInfo: {
        status: 'Accepted',
      },
    });

    console.log(`[StartTransaction] Transaction ${transactionId} started`);
  }

  async function handleStopTransaction(ws: WebSocket, messageId: string, payload: any) {
    const { transactionId, meterStop, timestamp, reason } = payload;
    console.log(`[StopTransaction] Transaction: ${transactionId}, Meter: ${meterStop}, Reason: ${reason}`);

    // Buscar a sessão
    const { data: session, error: sessionError } = await supabase
      .from('charging_sessions')
      .select('*, chargers(price_per_kwh)')
      .eq('transaction_id', transactionId)
      .single();

    if (sessionError || !session) {
      console.error('[StopTransaction] Session not found:', sessionError);
      sendCallError(ws, messageId, 'InternalError', 'Transaction not found');
      return;
    }

    // Calcular energia consumida e custo
    const energyConsumed = (meterStop - session.meter_start) / 1000; // Wh para kWh
    const cost = energyConsumed * session.chargers.price_per_kwh;

    // Atualizar sessão
    const { error: updateError } = await supabase
      .from('charging_sessions')
      .update({
        meter_stop: meterStop,
        energy_consumed: energyConsumed,
        cost: cost,
        ended_at: timestamp || new Date().toISOString(),
        status: 'completed',
        stop_reason: reason || 'Local',
      })
      .eq('transaction_id', transactionId);

    if (updateError) {
      console.error('[StopTransaction] Update error:', updateError);
    }

    // Atualizar status do carregador
    await supabase
      .from('chargers')
      .update({
        status: 'available',
        ocpp_protocol_status: 'Available',
      })
      .eq('ocpp_charge_point_id', chargePointId);

    sendCallResult(ws, messageId, {
      idTagInfo: {
        status: 'Accepted',
      },
    });

    console.log(`[StopTransaction] Transaction ${transactionId} stopped. Energy: ${energyConsumed.toFixed(2)} kWh, Cost: R$ ${cost.toFixed(2)}`);
  }

  async function handleMeterValues(ws: WebSocket, messageId: string, payload: any) {
    const { transactionId, meterValue } = payload;
    console.log(`[MeterValues] Transaction: ${transactionId}, Values:`, meterValue);

    // Processar leituras do medidor
    // Em produção, pode ser usado para monitoramento em tempo real
    
    sendCallResult(ws, messageId, {});
  }

  // Funções auxiliares para enviar mensagens

  function sendCallResult(ws: WebSocket, messageId: string, payload: any) {
    const message = [3, messageId, payload];
    ws.send(JSON.stringify(message));
    console.log(`[OCPP] Sent CALLRESULT for ${messageId}`);
  }

  function sendCallError(ws: WebSocket, messageId: string, errorCode: string, errorDescription: string) {
    const message = [4, messageId, errorCode, errorDescription, {}];
    ws.send(JSON.stringify(message));
    console.error(`[OCPP] Sent CALLERROR: ${errorCode} - ${errorDescription}`);
  }

  async function updateChargerStatus(cpId: string, status: string) {
    await supabase
      .from('chargers')
      .update({ ocpp_protocol_status: status })
      .eq('ocpp_charge_point_id', cpId);
  }

  return response;
});
