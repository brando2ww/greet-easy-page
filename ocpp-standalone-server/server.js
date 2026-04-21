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
// Última atividade WebSocket por CP (para detectar conexões "mortas silenciosamente")
const lastActivity = new Map();
// Buffer circular de mensagens OCPP por CP (últimas 500)
const messageBuffer = new Map();
const MESSAGE_BUFFER_SIZE = 500;
// Pending CALLs aguardando CALLRESULT/CALLERROR do CP (messageId -> { resolve, reject, timer })
const pendingCalls = new Map();

function awaitCallResult(messageId, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingCalls.delete(messageId);
      reject(new Error('Timeout waiting for CP response'));
    }, timeoutMs);
    pendingCalls.set(messageId, { resolve, reject, timer });
  });
}

function recordMessage(chargePointId, direction, action, payload) {
  if (!messageBuffer.has(chargePointId)) {
    messageBuffer.set(chargePointId, []);
  }
  const buf = messageBuffer.get(chargePointId);
  buf.push({
    timestamp: new Date().toISOString(),
    direction, // 'in' | 'out'
    action,
    payload,
  });
  if (buf.length > MESSAGE_BUFFER_SIZE) {
    buf.splice(0, buf.length - MESSAGE_BUFFER_SIZE);
  }
  lastActivity.set(chargePointId, Date.now());
}

const OCPP_INTERNAL_KEY = process.env.OCPP_INTERNAL_KEY || '';
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

  // API: Remote Start Transaction (sync — waits for CP CALLRESULT to know real Accepted/Rejected)
  if (req.method === 'POST' && url.pathname === '/api/remote-start') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', async () => {
      try {
        const { chargePointId, idTag, connectorId = 1 } = JSON.parse(body);
        const ws = activeConnections.get(chargePointId);

        if (!ws) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not connected' }));
          return;
        }

        const messageId = `remote-start-${Date.now()}`;
        const payload = { connectorId, idTag: idTag || 'REMOTE' };
        const message = [2, messageId, 'RemoteStartTransaction', payload];
        const waitPromise = awaitCallResult(messageId, 12000);
        ws.send(JSON.stringify(message));
        recordMessage(chargePointId, 'out', 'RemoteStartTransaction', payload);

        try {
          const result = await waitPromise;
          // OCPP 1.6: { status: 'Accepted' | 'Rejected' }
          const status = result?.status || 'Unknown';
          const accepted = status === 'Accepted';
          res.writeHead(accepted ? 200 : 200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: accepted,
            status,
            message: accepted
              ? 'RemoteStartTransaction accepted by charger'
              : `RemoteStartTransaction ${status} by charger`,
          }));
        } catch (waitErr) {
          res.writeHead(504, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            success: false,
            status: 'Timeout',
            message: 'Charger did not respond to RemoteStartTransaction in time',
          }));
        }
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
        const payload = { transactionId };
        const message = [2, messageId, 'RemoteStopTransaction', payload];
        ws.send(JSON.stringify(message));
        recordMessage(chargePointId, 'out', 'RemoteStopTransaction', payload);

        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'RemoteStopTransaction sent' }));
      } catch (err) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // ============ Diagnóstico interno (protegido por x-internal-key) ============
  function checkInternalKey() {
    const key = req.headers['x-internal-key'];
    if (!OCPP_INTERNAL_KEY || key !== OCPP_INTERNAL_KEY) {
      res.writeHead(401, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized' }));
      return false;
    }
    return true;
  }

  // GET /admin/messages?cp=140515&limit=100
  if (req.method === 'GET' && url.pathname === '/admin/messages') {
    if (!checkInternalKey()) return;
    const cp = url.searchParams.get('cp');
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);
    if (!cp) {
      res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'cp param required' }));
      return;
    }
    const buf = messageBuffer.get(cp) || [];
    const slice = buf.slice(-limit);
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      chargePointId: cp,
      total: buf.length,
      returned: slice.length,
      messages: slice,
    }));
    return;
  }

  // GET /admin/active-connections
  if (req.method === 'GET' && url.pathname === '/admin/active-connections') {
    if (!checkInternalKey()) return;
    const now = Date.now();
    const conns = Array.from(activeConnections.keys()).map((cp) => ({
      chargePointId: cp,
      lastActivityMs: lastActivity.get(cp) ? now - lastActivity.get(cp) : null,
      lastActivityAt: lastActivity.get(cp) ? new Date(lastActivity.get(cp)).toISOString() : null,
      readyState: activeConnections.get(cp)?.readyState,
    }));
    res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ count: conns.length, connections: conns }));
    return;
  }

  // POST /api/trigger-message  body: { chargePointId, requestedMessage, connectorId? }
  if (req.method === 'POST' && url.pathname === '/api/trigger-message') {
    if (!checkInternalKey()) return;
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const { chargePointId, requestedMessage, connectorId } = JSON.parse(body);
        const allowed = ['StatusNotification', 'MeterValues', 'BootNotification', 'Heartbeat', 'DiagnosticsStatusNotification', 'FirmwareStatusNotification'];
        if (!allowed.includes(requestedMessage)) {
          res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: `requestedMessage must be one of ${allowed.join(', ')}` }));
          return;
        }
        const ws = activeConnections.get(chargePointId);
        if (!ws) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not connected' }));
          return;
        }
        const messageId = `trigger-${Date.now()}`;
        const payload = { requestedMessage };
        if (typeof connectorId === 'number') payload.connectorId = connectorId;
        const message = [2, messageId, 'TriggerMessage', payload];
        ws.send(JSON.stringify(message));
        recordMessage(chargePointId, 'out', 'TriggerMessage', payload);
        res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'TriggerMessage sent', messageId }));
      } catch (err) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // POST /api/get-configuration  body: { chargePointId, key?: string[] }
  if (req.method === 'POST' && url.pathname === '/api/get-configuration') {
    if (!checkInternalKey()) return;
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { chargePointId, key } = JSON.parse(body);
        const ws = activeConnections.get(chargePointId);
        if (!ws) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not connected' }));
          return;
        }
        const messageId = `getconf-${Date.now()}`;
        const payload = {};
        if (Array.isArray(key) && key.length > 0) payload.key = key;
        const message = [2, messageId, 'GetConfiguration', payload];
        const waitPromise = awaitCallResult(messageId, 10000);
        ws.send(JSON.stringify(message));
        recordMessage(chargePointId, 'out', 'GetConfiguration', payload);
        try {
          const result = await waitPromise;
          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result }));
        } catch (waitErr) {
          res.writeHead(504, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: waitErr.message }));
        }
      } catch (err) {
        res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, message: err.message }));
      }
    });
    return;
  }

  // POST /api/change-configuration  body: { chargePointId, key, value }
  if (req.method === 'POST' && url.pathname === '/api/change-configuration') {
    if (!checkInternalKey()) return;
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { chargePointId, key, value } = JSON.parse(body);
        if (!key || value === undefined) {
          res.writeHead(400, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'key and value required' }));
          return;
        }
        const ws = activeConnections.get(chargePointId);
        if (!ws) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not connected' }));
          return;
        }
        const messageId = `changeconf-${Date.now()}`;
        const payload = { key: String(key), value: String(value) };
        const message = [2, messageId, 'ChangeConfiguration', payload];
        const waitPromise = awaitCallResult(messageId, 10000);
        ws.send(JSON.stringify(message));
        recordMessage(chargePointId, 'out', 'ChangeConfiguration', payload);
        try {
          const result = await waitPromise;
          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result }));
        } catch (waitErr) {
          res.writeHead(504, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: waitErr.message }));
        }
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
      lastActivity.set(chargePointId, Date.now());
      const message = JSON.parse(raw);

      const [messageType, messageId, action, payload] = message;

      // Registra TODA mensagem recebida no buffer de diagnóstico
      recordMessage(
        chargePointId,
        'in',
        messageType === 2 ? action : (messageType === 3 ? 'CALLRESULT' : (messageType === 4 ? 'CALLERROR' : `type:${messageType}`)),
        messageType === 2 ? payload : message.slice(2),
      );

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
            await handleMeterValues(ws, messageId, payload, chargePointId);
            break;
          default:
            console.log(`[OCPP Server] Unknown action: ${action}`);
            sendCallError(ws, messageId, 'NotSupported', `Action ${action} not supported`);
        }
      } else if (messageType === 3) { // CALLRESULT
        console.log(`[OCPP Server] Received CALLRESULT from ${chargePointId}:`, payload);
        const pending = pendingCalls.get(messageId);
        if (pending) {
          clearTimeout(pending.timer);
          pendingCalls.delete(messageId);
          pending.resolve(payload);
        }
      } else if (messageType === 4) { // CALLERROR
        console.error(`[OCPP Server] Received CALLERROR from ${chargePointId}:`, message);
        const pending = pendingCalls.get(messageId);
        if (pending) {
          clearTimeout(pending.timer);
          pendingCalls.delete(messageId);
          pending.reject(new Error(`CALLERROR: ${JSON.stringify(message.slice(2))}`));
        }
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

  // IMPORTANT: 'Preparing' means the plug was detected — NOT that energy is flowing.
  // We do NOT transition awaiting_plug → in_progress on Preparing (no timer, no billing).
  // The session only becomes in_progress when StartTransaction arrives (real authorization)
  // or MeterValues with a transactionId (real telemetry). 'Charging' alone is also accepted
  // as a fallback when the firmware skips StartTransaction notification timing.
  if (payload.status === 'Charging') {
    try {
      const { data: charger } = await supabase
        .from('chargers')
        .select('id')
        .eq('ocpp_charge_point_id', chargePointId)
        .maybeSingle();

      if (charger) {
        // Only activate if session has a transaction_id already (proves StartTransaction happened).
        // This avoids reacting to stale 'Charging' status without a real OCPP transaction.
        const { data: activated, error: activateErr } = await supabase
          .from('charging_sessions')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('charger_id', charger.id)
          .eq('status', 'awaiting_plug')
          .not('transaction_id', 'is', null)
          .select('id');

        if (activateErr) {
          console.error('[StatusNotification] Error activating awaiting_plug session:', activateErr);
        } else if (activated && activated.length > 0) {
          console.log(`[StatusNotification] Activated session ${activated[0].id} on Charging status (had transaction_id)`);
        }
      }
    } catch (err) {
      console.error('[StatusNotification] Error in awaiting_plug activation:', err);
    }
  }

  // Emergency stop: if status is Faulted, auto-close any active session
  if (payload.status === 'Faulted') {
    console.log(`[EmergencyStop] Detected Faulted status for ${chargePointId}, errorCode: ${payload.errorCode}`);
    try {
      // Find charger ID
      const { data: charger } = await supabase
        .from('chargers')
        .select('id')
        .eq('ocpp_charge_point_id', chargePointId)
        .maybeSingle();

      if (charger) {
        // Find active session
        const { data: activeSession } = await supabase
          .from('charging_sessions')
          .select('id, transaction_id, meter_start')
          .eq('charger_id', charger.id)
          .in('status', ['in_progress', 'awaiting_plug'])
          .maybeSingle();

        if (activeSession) {
          console.log(`[EmergencyStop] Closing session ${activeSession.id} (transaction: ${activeSession.transaction_id})`);

          // Send RemoteStopTransaction to the charger
          if (activeSession.transaction_id) {
            const msgId = `emergency-stop-${Date.now()}`;
            const stopMsg = [2, msgId, 'RemoteStopTransaction', { transactionId: activeSession.transaction_id }];
            ws.send(JSON.stringify(stopMsg));
          }

          // Mark session as completed with EmergencyStop reason
          await supabase
            .from('charging_sessions')
            .update({
              status: 'completed',
              stop_reason: 'EmergencyStop',
              ended_at: new Date().toISOString(),
            })
            .eq('id', activeSession.id);

          console.log(`[EmergencyStop] Session ${activeSession.id} closed due to emergency stop`);
        }

        // Always reset charger to available after emergency stop
        await updateChargerStatus(chargePointId, 'available', 'Available');
        console.log(`[EmergencyStop] Charger ${chargePointId} reset to available`);
      }
    } catch (emergencyErr) {
      console.error('[EmergencyStop] Error handling emergency stop:', emergencyErr);
    }
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
  console.log(`[StartTransaction] ${chargePointId} - Connector: ${payload.connectorId}, Meter: ${payload.meterStart}, idTag: ${payload.idTag}`);

  const transactionId = transactionIdCounter++;

  // Send OCPP response IMMEDIATELY (per spec + BootNotification pattern) before any DB I/O.
  // Strict firmwares (XIRU/ZETAUNO) may close the connection if response is delayed.
  sendCallResult(ws, messageId, {
    transactionId: transactionId,
    idTagInfo: {
      status: 'Accepted',
    },
  });

  console.log(`[StartTransaction] Responded transactionId=${transactionId} to ${chargePointId}, persisting...`);

  // Now do DB work (charger lookup, session resolution, persistence)
  try {
    const { data: charger } = await supabase
      .from('chargers')
      .select('id, price_per_kwh')
      .eq('ocpp_charge_point_id', chargePointId)
      .maybeSingle();

    if (!charger) {
      console.error(`[StartTransaction] Charger not found for ${chargePointId} after responding`);
      return;
    }

    // Resolution order:
    //   1. awaiting_plug session for this charger (most common app flow)
    //   2. in_progress session for this charger without transaction_id (race: Preparing already activated it)
    //   3. fallback: create new orphan session (local start without app)
    let resolvedSession = null;

    const { data: awaitingSession } = await supabase
      .from('charging_sessions')
      .select('id')
      .eq('charger_id', charger.id)
      .eq('status', 'awaiting_plug')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (awaitingSession) {
      resolvedSession = awaitingSession;
    } else {
      const { data: inProgressSession } = await supabase
        .from('charging_sessions')
        .select('id')
        .eq('charger_id', charger.id)
        .eq('status', 'in_progress')
        .is('transaction_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inProgressSession) {
        resolvedSession = inProgressSession;
        console.log(`[StartTransaction] No awaiting_plug found, linking to in_progress session ${inProgressSession.id} (Preparing already activated it)`);
      }
    }

    if (resolvedSession) {
      // Link the existing session to this transaction. Don't overwrite started_at if already set.
      const { error } = await supabase
        .from('charging_sessions')
        .update({
          status: 'in_progress',
          transaction_id: transactionId,
          meter_start: payload.meterStart,
          id_tag: payload.idTag,
        })
        .eq('id', resolvedSession.id);

      if (error) {
        console.error('[StartTransaction] DB update error linking session:', error);
        return;
      }

      console.log(`[StartTransaction] Linked session ${resolvedSession.id} to transaction ${transactionId}`);
    } else {
      // Fallback: create a new session (e.g. local start without app)
      const resolvedUserId = await resolveUserId(payload.idTag);
      const userId = resolvedUserId || '00000000-0000-0000-0000-000000000000';
      console.log(`[StartTransaction] No existing session found, creating orphan. user_id: ${userId} (idTag: ${payload.idTag})`);

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
        console.error('[StartTransaction] Database error creating orphan session:', error);
        return;
      }
    }

    await updateChargerStatus(chargePointId, 'in_use', 'Charging');
    console.log(`[StartTransaction] Transaction ${transactionId} ready for ${chargePointId}`);
  } catch (err) {
    console.error('[StartTransaction] Unexpected error during persistence:', err);
  }
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
    let latestSoC = null;

    for (const mv of meterValues) {
      const ts = mv.timestamp || new Date().toISOString();
      const sampledValues = mv.sampledValue || [];

      for (const sv of sampledValues) {
        const measurand = sv.measurand || 'Energy.Active.Import.Register';
        const value = parseFloat(sv.value);
        const unit = sv.unit || (measurand.includes('Energy') ? 'Wh' : measurand.includes('Power') ? 'W' : measurand.includes('Voltage') ? 'V' : measurand.includes('Current') ? 'A' : measurand === 'SoC' ? 'Percent' : '');
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

        // Track latest SoC reading
        if (measurand === 'SoC') {
          latestSoC = Math.round(value);
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

        const updateData = { energy_consumed: consumed, cost };
        if (latestSoC !== null) updateData.soc = latestSoC;

        await supabase
          .from('charging_sessions')
          .update(updateData)
          .eq('id', sessionId);

        console.log(`[MeterValues] Updated session ${sessionId}: ${consumed.toFixed(2)} kWh, R$ ${cost.toFixed(2)}${latestSoC !== null ? `, SoC: ${latestSoC}%` : ''}`);
      } else if (latestSoC !== null && sessionId) {
        // Update SoC even if no energy reading
        await supabase
          .from('charging_sessions')
          .update({ soc: latestSoC })
          .eq('id', sessionId);
        console.log(`[MeterValues] Updated session ${sessionId} SoC: ${latestSoC}%`);
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
