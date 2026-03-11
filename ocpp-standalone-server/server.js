import { WebSocketServer } from 'ws';
import { createClient } from '@supabase/supabase-js';
import http from 'http';

// Configuração do Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('ERROR: Missing required environment variables');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Armazena conexões ativas por Charge Point ID
const activeConnections = new Map();
let transactionIdCounter = 1000;

const PORT = process.env.PORT || 8080;

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Criar servidor HTTP
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  
  console.log(`[HTTP] ${req.method} ${url.pathname} from ${req.socket.remoteAddress}`);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  // Health check endpoints
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'online',
      service: 'OCPP WebSocket Server',
      version: '1.6J',
      uptime: process.uptime(),
      activeConnections: activeConnections.size,
      timestamp: new Date().toISOString(),
    }));
    return;
  }

  // API: List active connections
  if (req.method === 'GET' && url.pathname === '/api/connections') {
    const connections = Array.from(activeConnections.keys());
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ connections, count: connections.length }));
    return;
  }

  // API: Remote Start Transaction
  if (req.method === 'POST' && url.pathname === '/api/remote-start') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { chargePointId, idTag, connectorId = 1 } = JSON.parse(body);
        const ws = activeConnections.get(chargePointId);
        
        if (!ws) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not connected' }));
          return;
        }

        const messageId = `remote-start-${Date.now()}`;
        const message = [2, messageId, 'RemoteStartTransaction', { connectorId, idTag: idTag || 'REMOTE' }];
        ws.send(JSON.stringify(message));

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'RemoteStartTransaction sent' }));
      } catch (err) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // API: Remote Stop Transaction
  if (req.method === 'POST' && url.pathname === '/api/remote-stop') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { chargePointId, transactionId } = JSON.parse(body);
        const ws = activeConnections.get(chargePointId);
        
        if (!ws) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not connected' }));
          return;
        }

        const messageId = `remote-stop-${Date.now()}`;
        const message = [2, messageId, 'RemoteStopTransaction', { transactionId }];
        ws.send(JSON.stringify(message));

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'RemoteStopTransaction sent' }));
      } catch (err) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // 404 for other routes
  res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

// Criar servidor WebSocket em modo noServer para controle total do upgrade
const wss = new WebSocketServer({
  noServer: true,
  handleProtocols: (protocols) => {
    if (protocols.has('ocpp1.6')) return 'ocpp1.6';
    if (protocols.has('ocpp1.6j')) return 'ocpp1.6j';
    if (protocols.has('ocpp2.0')) return 'ocpp2.0';
    if (protocols.has('ocpp1.5')) return 'ocpp1.5';
    for (const p of protocols) {
      if (p.includes('ocpp')) return p;
    }
    return false;
  },
});

console.log(`[OCPP Server] Starting on port ${PORT}...`);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[OCPP Server] HTTP server listening on http://0.0.0.0:${PORT}`);
  console.log(`[OCPP Server] WebSocket server ready at ws://0.0.0.0:${PORT}`);
  console.log('[OCPP Server] Ready to accept connections from chargers');
  console.log('[OCPP Server] Expected connection format: ws://your-domain/ocpp/{chargePointId}');
  console.log('[OCPP Server] Health check available at: http://your-domain/health');
});

// Handler explicito para upgrade WebSocket - garante que HTTP 404 nunca interfira
server.on('upgrade', (request, socket, head) => {
  console.log(`[WebSocket Upgrade] URL: ${request.url}`);
  console.log(`[WebSocket Upgrade] Protocol: ${request.headers['sec-websocket-protocol'] || 'none'}`);
  console.log(`[WebSocket Upgrade] From: ${request.socket.remoteAddress}`);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  const chargePointId = pathParts[pathParts.length - 1];
  
  console.log(`[OCPP Server] New connection attempt from Charge Point ID: ${chargePointId}`);
  console.log(`[OCPP Server] Full URL: ${req.url}`);
  console.log(`[OCPP Server] Client IP: ${req.socket.remoteAddress}`);
  console.log(`[OCPP Server] Headers:`, req.headers);

  if (!chargePointId) {
    console.error('[OCPP Server] No Charge Point ID in URL');
    ws.close(1008, 'Missing Charge Point ID in URL path');
    return;
  }

  // Validar se o carregador existe no banco
  const { data: charger, error: chargerError } = await supabase
    .from('chargers')
    .select('id, name, ocpp_charge_point_id')
    .eq('ocpp_charge_point_id', chargePointId)
    .maybeSingle();

  if (chargerError) {
    console.error('[OCPP Server] Database error:', chargerError);
    ws.close(1011, 'Database error');
    return;
  }

  if (!charger) {
    console.error(`[OCPP Server] Charge Point ${chargePointId} not registered`);
    ws.close(1008, 'Charger not registered in system');
    return;
  }

  console.log(`[OCPP Server] Charger validated: ${charger.name} (ID: ${charger.id})`);
  console.log(`[OCPP Server] Connection established with ${chargePointId}`);

  let heartbeatInterval = null;

  ws.on('message', async (data) => {
    try {
      const raw = data.toString();
      console.log(`[OCPP Server] Raw message from ${chargePointId}:`, raw);
      const message = JSON.parse(raw);

      const [messageType, messageId, action, payload] = message;

      if (messageType === 2) { // CALL
        switch (action) {
          case 'BootNotification':
            await handleBootNotification(ws, messageId, payload, chargePointId);
            break;
          case 'Heartbeat':
            await handleHeartbeat(ws, messageId, chargePointId);
            break;
          case 'StatusNotification':
            await handleStatusNotification(ws, messageId, payload, chargePointId);
            break;
          case 'Authorize':
            await handleAuthorize(ws, messageId, payload);
            break;
          case 'StartTransaction':
            await handleStartTransaction(ws, messageId, payload, chargePointId);
            break;
          case 'StopTransaction':
            await handleStopTransaction(ws, messageId, payload, chargePointId);
            break;
          case 'MeterValues':
            await handleMeterValues(ws, messageId, payload);
            break;
          default:
            console.log(`[OCPP Server] Unknown action: ${action}`);
            sendCallError(ws, messageId, 'NotSupported', `Action ${action} not supported`);
        }
      } else if (messageType === 3) { // CALLRESULT
        console.log(`[OCPP Server] Received CALLRESULT from ${chargePointId}:`, payload);
      } else if (messageType === 4) { // CALLERROR
        console.error(`[OCPP Server] Received CALLERROR from ${chargePointId}:`, message);
      }
    } catch (error) {
      console.error(`[OCPP Server] Error processing message from ${chargePointId}:`, error.message);
      console.error(`[OCPP Server] Stack:`, error.stack);
    }
  });

  ws.on('close', async () => {
    console.log(`[OCPP Server] Connection closed with ${chargePointId}`);
    activeConnections.delete(chargePointId);
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
    }

    await updateChargerStatus(chargePointId, 'unavailable', 'Offline');
  });

  ws.on('error', (error) => {
    console.error(`[OCPP Server] WebSocket error for ${chargePointId}:`, error);
  });

  // Registrar conexão ativa
  activeConnections.set(chargePointId, ws);
});

// Handlers OCPP

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

async function handleHeartbeat(ws, messageId, chargePointId) {
  sendCallResult(ws, messageId, {
    currentTime: new Date().toISOString(),
  });

  try {
    const { error } = await supabase
      .from('chargers')
      .update({ last_heartbeat: new Date().toISOString() })
      .eq('ocpp_charge_point_id', chargePointId);
    if (error) console.error('[Heartbeat] DB update error:', error);
  } catch (dbError) {
    console.error('[Heartbeat] DB exception:', dbError);
  }
}

async function handleStatusNotification(ws, messageId, payload, chargePointId) {
  console.log(`[StatusNotification] ${chargePointId} - Status: ${payload.status}, Error: ${payload.errorCode}`);

  sendCallResult(ws, messageId, {});

  const statusMap = {
    'Available': 'available',
    'Occupied': 'in_use',
    'Charging': 'in_use',
    'Preparing': 'in_use',
    'Finishing': 'in_use',
    'Reserved': 'in_use',
    'Unavailable': 'unavailable',
    'Faulted': 'unavailable',
  };

  try {
    const { error } = await supabase
      .from('chargers')
      .update({
        status: statusMap[payload.status] || 'unavailable',
        ocpp_protocol_status: payload.status,
        ocpp_error_code: payload.errorCode !== 'NoError' ? payload.errorCode : null,
      })
      .eq('ocpp_charge_point_id', chargePointId);
    if (error) console.error('[StatusNotification] DB update error:', error);
  } catch (dbError) {
    console.error('[StatusNotification] DB exception:', dbError);
  }
}

async function handleAuthorize(ws, messageId, payload) {
  console.log(`[Authorize] ID Tag: ${payload.idTag}`);

  sendCallResult(ws, messageId, {
    idTagInfo: {
      status: 'Accepted',
    },
  });
}

// Resolve user_id from idTag (email or UUID)
async function resolveUserId(idTag) {
  if (!idTag || idTag === 'REMOTE') return null;
  
  // If it looks like a UUID, check profiles directly
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idTag)) {
    const { data } = await supabase.from('profiles').select('id').eq('id', idTag).maybeSingle();
    return data?.id || null;
  }
  
  // Try as email
  const { data } = await supabase.from('profiles').select('id').eq('email', idTag).maybeSingle();
  return data?.id || null;
}

async function handleStartTransaction(ws, messageId, payload, chargePointId) {
  console.log(`[StartTransaction] ${chargePointId} - Connector: ${payload.connectorId}, Meter: ${payload.meterStart}`);

  const { data: charger } = await supabase
    .from('chargers')
    .select('id, price_per_kwh')
    .eq('ocpp_charge_point_id', chargePointId)
    .single();

  if (!charger) {
    sendCallError(ws, messageId, 'InternalError', 'Charger not found');
    return;
  }

  // Resolve real user_id from idTag
  const resolvedUserId = await resolveUserId(payload.idTag);
  const userId = resolvedUserId || '00000000-0000-0000-0000-000000000000';
  console.log(`[StartTransaction] Resolved user_id: ${userId} (from idTag: ${payload.idTag})`);

  const transactionId = transactionIdCounter++;

  const { error } = await supabase
    .from('charging_sessions')
    .insert({
      charger_id: charger.id,
      user_id: userId,
      transaction_id: transactionId,
      meter_start: payload.meterStart,
      id_tag: payload.idTag,
      started_at: new Date(payload.timestamp).toISOString(),
      status: 'in_progress',
    });

  if (error) {
    console.error('[StartTransaction] Database error:', error);
    sendCallError(ws, messageId, 'InternalError', 'Failed to create session');
    return;
  }

  await updateChargerStatus(chargePointId, 'in_use', 'Charging');

  sendCallResult(ws, messageId, {
    transactionId: transactionId,
    idTagInfo: {
      status: 'Accepted',
    },
  });

  console.log(`[StartTransaction] Created transaction ${transactionId} for ${chargePointId} (user: ${userId})`);
}

async function handleStopTransaction(ws, messageId, payload, chargePointId) {
  console.log(`[StopTransaction] Transaction ${payload.transactionId} - Meter: ${payload.meterStop}`);

  const { data: session } = await supabase
    .from('charging_sessions')
    .select('*, chargers(price_per_kwh)')
    .eq('transaction_id', payload.transactionId)
    .single();

  if (!session) {
    sendCallError(ws, messageId, 'InternalError', 'Session not found');
    return;
  }

  const energyConsumed = (payload.meterStop - session.meter_start) / 1000;
  const cost = energyConsumed * session.chargers.price_per_kwh;

  await supabase
    .from('charging_sessions')
    .update({
      meter_stop: payload.meterStop,
      energy_consumed: energyConsumed,
      cost: cost,
      ended_at: new Date(payload.timestamp).toISOString(),
      status: 'completed',
      stop_reason: payload.reason,
    })
    .eq('transaction_id', payload.transactionId);

  await updateChargerStatus(chargePointId, 'available', 'Available');

  sendCallResult(ws, messageId, {
    idTagInfo: {
      status: 'Accepted',
    },
  });

  console.log(`[StopTransaction] Completed transaction ${payload.transactionId} - ${energyConsumed.toFixed(2)} kWh, R$ ${cost.toFixed(2)}`);
}

async function handleMeterValues(ws, messageId, payload, chargePointId) {
  console.log(`[MeterValues] Transaction: ${payload.transactionId}`, JSON.stringify(payload.meterValue));
  
  // Respond immediately
  sendCallResult(ws, messageId, {});

  // Parse and save meter values to database
  try {
    const transactionId = payload.transactionId;
    const connectorId = payload.connectorId;

    // Find session by transaction_id
    let sessionId = null;
    if (transactionId) {
      const { data: session } = await supabase
        .from('charging_sessions')
        .select('id')
        .eq('transaction_id', transactionId)
        .maybeSingle();
      sessionId = session?.id || null;
    }

    // OCPP 1.6: meterValue is an array of { timestamp, sampledValue: [{ value, measurand, unit, phase, context }] }
    const meterValues = payload.meterValue || [];
    const rows = [];
    let latestEnergyWh = null;

    for (const mv of meterValues) {
      const ts = mv.timestamp || new Date().toISOString();
      const sampledValues = mv.sampledValue || [];

      for (const sv of sampledValues) {
        const measurand = sv.measurand || 'Energy.Active.Import.Register';
        const value = parseFloat(sv.value);
        const unit = sv.unit || (measurand.includes('Energy') ? 'Wh' : measurand.includes('Power') ? 'W' : measurand.includes('Voltage') ? 'V' : measurand.includes('Current') ? 'A' : '');
        const phase = sv.phase || null;
        const context = sv.context || 'Sample.Periodic';

        if (isNaN(value)) continue;

        rows.push({
          session_id: sessionId,
          transaction_id: transactionId,
          timestamp: ts,
          connector_id: connectorId,
          measurand,
          value,
          unit,
          phase,
          context,
        });

        // Track latest energy reading
        if (measurand === 'Energy.Active.Import.Register') {
          latestEnergyWh = value;
        }
      }
    }

    if (rows.length > 0) {
      const { error } = await supabase.from('meter_values').insert(rows);
      if (error) {
        console.error('[MeterValues] DB insert error:', error);
      } else {
        console.log(`[MeterValues] Saved ${rows.length} readings for transaction ${transactionId}`);
      }
    }

    // Update energy_consumed on the session for real-time display
    if (latestEnergyWh !== null && sessionId) {
      const energyKwh = latestEnergyWh / 1000;
      const { data: session } = await supabase
        .from('charging_sessions')
        .select('meter_start, chargers(price_per_kwh)')
        .eq('id', sessionId)
        .single();

      if (session) {
        const meterStartWh = session.meter_start || 0;
        const consumed = (latestEnergyWh - meterStartWh) / 1000;
        const cost = consumed * (session.chargers?.price_per_kwh || 0.80);

        await supabase
          .from('charging_sessions')
          .update({ energy_consumed: consumed, cost })
          .eq('id', sessionId);

        console.log(`[MeterValues] Updated session ${sessionId}: ${consumed.toFixed(2)} kWh, R$ ${cost.toFixed(2)}`);
      }
    }
  } catch (dbError) {
    console.error('[MeterValues] DB exception:', dbError);
  }
}

// Funções auxiliares

function sendCallResult(ws, messageId, payload) {
  const message = [3, messageId, payload];
  ws.send(JSON.stringify(message));
}

function sendCallError(ws, messageId, errorCode, errorDescription) {
  const message = [4, messageId, errorCode, errorDescription, {}];
  ws.send(JSON.stringify(message));
}

async function updateChargerStatus(chargePointId, status, ocppStatus) {
  await supabase
    .from('chargers')
    .update({
      status: status,
      ocpp_protocol_status: ocppStatus,
    })
    .eq('ocpp_charge_point_id', chargePointId);
}

// Tratamento de erros global
process.on('uncaughtException', (error) => {
  console.error('[OCPP Server] Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[OCPP Server] Unhandled rejection at:', promise, 'reason:', reason);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[OCPP Server] SIGTERM received, closing server...');
  server.close(() => {
    console.log('[OCPP Server] HTTP server closed');
    wss.close(() => {
      console.log('[OCPP Server] WebSocket server closed');
      process.exit(0);
    });
  });
});
