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
// Flag em memória: sessões que já tiveram started_at realinhado neste processo
const firstMeterRealigned = new Set();

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

// Inicializa o transactionIdCounter a partir do MAX no banco para evitar colisões após restart
async function initTransactionIdCounter() {
  try {
    const { data, error } = await supabase
      .from('charging_sessions')
      .select('transaction_id')
      .not('transaction_id', 'is', null)
      .order('transaction_id', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!error && data?.transaction_id) {
      transactionIdCounter = data.transaction_id + 1;
      console.log(`[OCPP Server] transactionIdCounter initialized to ${transactionIdCounter}`);
    }
  } catch (e) {
    console.error('[OCPP Server] Failed to initialize transactionIdCounter:', e?.message);
  }
}

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
          const status = result?.status || 'Unknown';
          const accepted = status === 'Accepted';
          res.writeHead(200, { ...corsHeaders, 'Content-Type': 'application/json' });
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

  // POST /api/reset  body: { chargePointId, type?: 'Soft' | 'Hard' }
  if (req.method === 'POST' && url.pathname === '/api/reset') {
    if (!checkInternalKey()) return;
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const { chargePointId, type = 'Soft' } = JSON.parse(body);
        const ws = activeConnections.get(chargePointId);
        if (!ws) {
          res.writeHead(404, { ...corsHeaders, 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, message: 'Charger not connected' }));
          return;
        }
        const messageId = `reset-${Date.now()}`;
        const payload = { type: type === 'Hard' ? 'Hard' : 'Soft' };
        const message = [2, messageId, 'Reset', payload];
        const waitPromise = awaitCallResult(messageId, 8000);
        ws.send(JSON.stringify(message));
        recordMessage(chargePointId, 'out', 'Reset', payload);
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

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`[OCPP Server] HTTP server listening on http://0.0.0.0:${PORT}`);
  console.log(`[OCPP Server] WebSocket server ready at ws://0.0.0.0:${PORT}`);
  console.log('[OCPP Server] Ready to accept connections from chargers');
  console.log('[OCPP Server] Expected connection format: ws://your-domain/ocpp/{chargePointId}');
  console.log('[OCPP Server] Health check available at: http://your-domain/health');
  await initTransactionIdCounter();
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

// =====================================================================
// WEBSOCKET ZOMBIE DETECTION (ping/pong every 30s)
// =====================================================================
const PING_INTERVAL_MS = 30_000;
const STALE_HEARTBEAT_MS = 3 * 60_000; // 3 minutes

const wsPingInterval = setInterval(() => {
  for (const [cpId, ws] of activeConnections.entries()) {
    if (ws.isAlive === false) {
      console.warn(`[OCPP] Terminated zombie connection: ${cpId}`);
      try { ws.terminate(); } catch {}
      activeConnections.delete(cpId);
      supabase
        .from('chargers')
        .update({ ocpp_protocol_status: 'Offline' })
        .eq('ocpp_charge_point_id', cpId)
        .then(() => {}, (e) => console.error('[OCPP] Failed to mark zombie offline:', e?.message));
      continue;
    }
    ws.isAlive = false;
    try { ws.ping(); } catch (e) {
      console.error(`[OCPP] Ping failed for ${cpId}:`, e?.message);
    }
  }
}, PING_INTERVAL_MS);

const staleHeartbeatSweep = setInterval(async () => {
  try {
    const cutoff = new Date(Date.now() - STALE_HEARTBEAT_MS).toISOString();
    const { data, error } = await supabase
      .from('chargers')
      .update({ ocpp_protocol_status: 'Offline' })
      .neq('ocpp_protocol_status', 'Offline')
      .lt('last_heartbeat', cutoff)
      .select('id, ocpp_charge_point_id');
    if (error) {
      console.error('[OCPP] Stale heartbeat sweep error:', error.message);
    } else if (data && data.length > 0) {
      console.warn(`[OCPP] Stale-heartbeat sweep marked ${data.length} charger(s) Offline:`,
        data.map((c) => c.ocpp_charge_point_id).join(', '));
    }
  } catch (e) {
    console.error('[OCPP] Stale heartbeat sweep crash:', e?.message);
  }
}, 60_000);

wss.on('close', () => {
  clearInterval(wsPingInterval);
  clearInterval(staleHeartbeatSweep);
});

wss.on('connection', async (ws, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  const chargePointId = pathParts[pathParts.length - 1];

  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });
  
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

      // OCPP message framing:
      //   CALL:        [2, messageId, action, payload]        (4 elements)
      //   CALLRESULT:  [3, messageId, payload]                (3 elements)
      //   CALLERROR:   [4, messageId, errCode, errDesc, errDetails] (5 elements)
      // Destructuring as 4 elements unconditionally caused CALLRESULT payloads
      // to be assigned to `action` while `payload` became undefined, breaking
      // RemoteStartTransaction (status "Accepted" was lost → reported as Unknown).
      const messageType = message[0];
      const messageId = message[1];
      let action;
      let payload;
      if (messageType === 2) {
        action = message[2];
        payload = message[3];
      } else {
        // CALLRESULT / CALLERROR carry payload at index 2
        payload = message[2];
      }

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

  activeConnections.set(chargePointId, ws);
});

// =====================================================================
// HANDLERS OCPP 1.6J
// =====================================================================

async function handleBootNotification(ws, messageId, payload, chargePointId) {
  console.log(`[BootNotification] Processing for ${chargePointId}`, payload);

  sendCallResult(ws, messageId, {
    status: 'Accepted',
    currentTime: new Date().toISOString(),
    interval: 300,
  });

  console.log(`[BootNotification] Accepted for ${chargePointId}`);

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

// =====================================================================
// FIX PRINCIPAL: handleStatusNotification
//
// Fluxo OCPP 1.6J correto ao conectar plug:
//   Available → Preparing  (plug inserido, aguardando autorização)
//   Preparing → Charging   (StartTransaction aceito, corrente fluindo)
//
// O bug anterior só ativava a sessão em 'Charging' E exigia transaction_id
// já presente. Como StartTransaction e StatusNotification chegam quase
// simultaneamente, a sessão ficava presa em 'awaiting_plug'.
//
// Correção:
//   • 'Preparing' → ativa awaiting_plug imediatamente (plug detectado)
//   • 'Charging'  → garante ativação como fallback (firmwares que saltam
//                   direto para Charging sem passar por Preparing)
//   • Em ambos os casos NÃO exige transaction_id pré-existente, pois o
//     StartTransaction pode ainda não ter chegado.
// =====================================================================
async function handleStatusNotification(ws, messageId, payload, chargePointId) {
  console.log(`[StatusNotification] ${chargePointId} - Status: ${payload.status}, Error: ${payload.errorCode}`);

  // OCPP spec: respond with empty payload immediately
  sendCallResult(ws, messageId, {});

  // Map OCPP status to our internal status
  const statusMap = {
    'Available':   'available',
    'Occupied':    'in_use',
    'Charging':    'in_use',
    'Preparing':   'in_use',   // plug conectado = em uso
    'Finishing':   'in_use',
    'Reserved':    'in_use',
    'Unavailable': 'unavailable',
    'Faulted':     'unavailable',
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

  // -----------------------------------------------------------------------
  // CORREÇÃO: Ativa sessão awaiting_plug tanto em 'Preparing' quanto 'Charging'
  //
  // OCPP 1.6J Section 4.2 (Start Transaction):
  //   The Charge Point SHALL send a StatusNotification with status=Preparing
  //   when the connector becomes occupied (plug inserted).
  //   The session awaiting_plug MUST be activated at this point so the
  //   front-end transitions out of "waiting for plug" state.
  // -----------------------------------------------------------------------
  if (payload.status === 'Preparing' || payload.status === 'Charging') {
    try {
      const { data: chargerRow } = await supabase
        .from('chargers')
        .select('id')
        .eq('ocpp_charge_point_id', chargePointId)
        .maybeSingle();

      if (chargerRow) {
        // Activate any awaiting_plug session for this charger.
        // Do NOT filter by transaction_id — StartTransaction may not have
        // arrived yet (race condition). The transaction_id will be set
        // when StartTransaction is processed.
        const { data: activated, error: activateErr } = await supabase
          .from('charging_sessions')
          .update({
            status: 'in_progress',
            // Only set started_at if not already set (idempotent)
            started_at: new Date().toISOString(),
          })
          .eq('charger_id', chargerRow.id)
          .eq('status', 'awaiting_plug')
          .is('started_at', null)  // only activate once
          .select('id');

        if (activateErr) {
          console.error(`[StatusNotification] Error activating awaiting_plug session on ${payload.status}:`, activateErr);
        } else if (activated && activated.length > 0) {
          console.log(`[StatusNotification] ✓ Activated awaiting_plug session ${activated[0].id} on status=${payload.status}`);
        } else {
          console.log(`[StatusNotification] No awaiting_plug session to activate for ${chargePointId} on status=${payload.status}`);
        }
      }
    } catch (err) {
      console.error('[StatusNotification] Error in awaiting_plug activation:', err);
    }
  }

  // -----------------------------------------------------------------------
  // Quando status volta para 'Available', garantir que sessões
  // awaiting_plug antigas (plug nunca conectado) sejam canceladas.
  // Evita sessões "fantasma" no banco.
  // -----------------------------------------------------------------------
  if (payload.status === 'Available') {
    try {
      const { data: chargerRow } = await supabase
        .from('chargers')
        .select('id')
        .eq('ocpp_charge_point_id', chargePointId)
        .maybeSingle();

      if (chargerRow) {
        const { data: cancelled, error: cancelErr } = await supabase
          .from('charging_sessions')
          .update({ status: 'cancelled', ended_at: new Date().toISOString() })
          .eq('charger_id', chargerRow.id)
          .eq('status', 'awaiting_plug')
          .select('id');

        if (cancelErr) {
          console.error('[StatusNotification] Error cancelling stale awaiting_plug sessions:', cancelErr);
        } else if (cancelled && cancelled.length > 0) {
          console.log(`[StatusNotification] Cancelled ${cancelled.length} stale awaiting_plug session(s) on Available`);
        }
      }
    } catch (err) {
      console.error('[StatusNotification] Error cancelling stale sessions:', err);
    }
  }

  // Emergency stop: if status is Faulted, auto-close any active session
  if (payload.status === 'Faulted') {
    console.log(`[EmergencyStop] Detected Faulted status for ${chargePointId}, errorCode: ${payload.errorCode}`);
    try {
      const { data: chargerRow } = await supabase
        .from('chargers')
        .select('id')
        .eq('ocpp_charge_point_id', chargePointId)
        .maybeSingle();

      if (chargerRow) {
        const { data: activeSession } = await supabase
          .from('charging_sessions')
          .select('id, transaction_id, meter_start')
          .eq('charger_id', chargerRow.id)
          .in('status', ['in_progress', 'awaiting_plug'])
          .maybeSingle();

        if (activeSession) {
          console.log(`[EmergencyStop] Closing session ${activeSession.id} (transaction: ${activeSession.transaction_id})`);

          if (activeSession.transaction_id) {
            const msgId = `emergency-stop-${Date.now()}`;
            const stopMsg = [2, msgId, 'RemoteStopTransaction', { transactionId: activeSession.transaction_id }];
            ws.send(JSON.stringify(stopMsg));
          }

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
    idTagInfo: { status: 'Accepted' },
  });
}

// Resolve user_id from idTag (email or UUID)
async function resolveUserId(idTag) {
  if (!idTag || idTag === 'REMOTE') return null;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(idTag)) {
    const { data } = await supabase.from('profiles').select('id').eq('id', idTag).maybeSingle();
    return data?.id || null;
  }
  
  const { data } = await supabase.from('profiles').select('id').eq('email', idTag).maybeSingle();
  return data?.id || null;
}

// =====================================================================
// FIX: handleStartTransaction
//
// Responde IMEDIATAMENTE (antes de qualquer I/O) e depois persiste.
// Lógica de resolução de sessão:
//   1. awaiting_plug → ativa e vincula (fluxo normal via app)
//   2. in_progress sem transaction_id → vincula (Preparing já ativou)
//   3. fallback → cria sessão nova (início local sem app)
//
// CORREÇÃO: ao atualizar sessão em awaiting_plug, seta started_at
// somente se ainda for null, evitando sobrescrever o valor já definido
// pelo StatusNotification Preparing.
// =====================================================================
async function handleStartTransaction(ws, messageId, payload, chargePointId) {
  console.log(`[StartTransaction] ${chargePointId} - Connector: ${payload.connectorId}, Meter: ${payload.meterStart}, idTag: ${payload.idTag}`);

  const transactionId = transactionIdCounter++;

  // Responde IMEDIATAMENTE conforme spec OCPP 1.6J
  sendCallResult(ws, messageId, {
    transactionId: transactionId,
    idTagInfo: { status: 'Accepted' },
  });

  console.log(`[StartTransaction] Responded transactionId=${transactionId} to ${chargePointId}, persisting...`);

  try {
    const { data: charger } = await supabase
      .from('chargers')
      .select('id, price_per_kwh')
      .eq('ocpp_charge_point_id', chargePointId)
      .maybeSingle();

    if (!charger) {
      console.error(`[StartTransaction] Charger not found for ${chargePointId}`);
      return;
    }

    let resolvedSession = null;

    // 1. Tenta sessão awaiting_plug (fluxo normal: plug ainda não ativou por Preparing)
    const { data: awaitingSession } = await supabase
      .from('charging_sessions')
      .select('id, started_at')
      .eq('charger_id', charger.id)
      .eq('status', 'awaiting_plug')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (awaitingSession) {
      resolvedSession = { ...awaitingSession, source: 'awaiting_plug' };
    } else {
      // 2. Tenta sessão in_progress sem transaction_id (Preparing já ativou)
      const { data: inProgressSession } = await supabase
        .from('charging_sessions')
        .select('id, started_at')
        .eq('charger_id', charger.id)
        .eq('status', 'in_progress')
        .is('transaction_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (inProgressSession) {
        resolvedSession = { ...inProgressSession, source: 'in_progress_no_txn' };
        console.log(`[StartTransaction] Linking to in_progress session ${inProgressSession.id} (already activated by Preparing)`);
      }
    }

    if (resolvedSession) {
      const updatePayload = {
        status: 'in_progress',
        transaction_id: transactionId,
        meter_start: payload.meterStart,
        id_tag: payload.idTag,
      };

      // Só define started_at se ainda não foi definido (evita sobrescrever o timestamp do Preparing)
      if (!resolvedSession.started_at) {
        updatePayload.started_at = payload.timestamp
          ? new Date(payload.timestamp).toISOString()
          : new Date().toISOString();
      }

      const { error } = await supabase
        .from('charging_sessions')
        .update(updatePayload)
        .eq('id', resolvedSession.id);

      if (error) {
        console.error('[StartTransaction] DB update error linking session:', error);
        return;
      }

      console.log(`[StartTransaction] ✓ Linked session ${resolvedSession.id} (source: ${resolvedSession.source}) to transaction ${transactionId}`);
    } else {
      
      // 3. Fallback: cria sessão nova apenas se o idTag for um usuário real.
// idTags desconhecidos (tokens internos do firmware) são ignorados para
// evitar violação de foreign key no banco.
const resolvedUserId = await resolveUserId(payload.idTag);

if (!resolvedUserId) {
  console.log(`[StartTransaction] Unknown idTag "${payload.idTag}" — not a registered user, skipping orphan session`);
  return;
}

console.log(`[StartTransaction] No existing session, creating orphan for user ${resolvedUserId} (idTag: ${payload.idTag})`);

const { error } = await supabase
  .from('charging_sessions')
  .insert({
    charger_id: charger.id,
    user_id: resolvedUserId,
    transaction_id: transactionId,
    meter_start: payload.meterStart,
    id_tag: payload.idTag,
    started_at: payload.timestamp
      ? new Date(payload.timestamp).toISOString()
      : new Date().toISOString(),
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

  // Respond immediately per OCPP spec
  sendCallResult(ws, messageId, {
    idTagInfo: { status: 'Accepted' },
  });

  try {
    const { data: session } = await supabase
      .from('charging_sessions')
      .select('*, chargers(price_per_kwh)')
      .eq('transaction_id', payload.transactionId)
      .maybeSingle();

    if (!session) {
      console.error(`[StopTransaction] Session not found for transaction ${payload.transactionId}`);
      return;
    }

    const meterStart = session.meter_start || 0;
    const energyConsumed = (payload.meterStop - meterStart) / 1000;
    const pricePerKwh = session.chargers?.price_per_kwh || 0.80;
    const cost = energyConsumed * pricePerKwh;

    await supabase
      .from('charging_sessions')
      .update({
        meter_stop: payload.meterStop,
        energy_consumed: energyConsumed,
        cost: cost,
        ended_at: payload.timestamp
          ? new Date(payload.timestamp).toISOString()
          : new Date().toISOString(),
        status: 'completed',
        stop_reason: payload.reason || null,
      })
      .eq('transaction_id', payload.transactionId);

    await updateChargerStatus(chargePointId, 'available', 'Available');

    // Limpa flag de realinhamento para este session.id
    if (session?.id) {
      firstMeterRealigned.delete(session.id);
    }

    console.log(`[StopTransaction] ✓ Completed transaction ${payload.transactionId} - ${energyConsumed.toFixed(2)} kWh, R$ ${cost.toFixed(2)}`);
  } catch (err) {
    console.error('[StopTransaction] Unexpected error:', err);
  }
}

async function handleMeterValues(ws, messageId, payload, chargePointId) {
  console.log(`[MeterValues] Transaction: ${payload.transactionId}`, JSON.stringify(payload.meterValue));
  
  sendCallResult(ws, messageId, {});

  try {
    const transactionId = payload.transactionId;
    const connectorId = payload.connectorId;

    let sessionId = null;
    let sessionRow = null;
    if (transactionId) {
      const { data: session } = await supabase
        .from('charging_sessions')
        .select('id, status, meter_start, started_at')
        .eq('transaction_id', transactionId)
        .maybeSingle();
      sessionId = session?.id || null;
      sessionRow = session || null;

      // MeterValues com transactionId real = carregamento ativo; ativa sessão se ainda awaiting
      if (session && session.status === 'awaiting_plug') {
        await supabase
          .from('charging_sessions')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', session.id);
        console.log(`[MeterValues] Activated awaiting_plug session ${session.id} via real telemetry`);
      }
    }

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
        const unit = sv.unit || (
          measurand.includes('Energy') ? 'Wh' :
          measurand.includes('Power') ? 'W' :
          measurand.includes('Voltage') ? 'V' :
          measurand.includes('Current') ? 'A' :
          measurand === 'SoC' ? 'Percent' : ''
        );
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

        if (measurand === 'Energy.Active.Import.Register') {
          latestEnergyWh = value;
        }
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

    // Realinha started_at para o timestamp real do primeiro MeterValues
    // Gate: meter_start !== null (prova que StartTransaction chegou)
    if (
      sessionId &&
      sessionRow &&
      sessionRow.status === 'in_progress' &&
      sessionRow.meter_start !== null &&
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

    if (latestEnergyWh !== null && sessionId) {
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
      }
    } else if (latestSoC !== null && sessionId) {
      await supabase
        .from('charging_sessions')
        .update({ soc: latestSoC })
        .eq('id', sessionId);
      console.log(`[MeterValues] Updated session ${sessionId} SoC: ${latestSoC}%`);
    }
  } catch (dbError) {
    console.error('[MeterValues] DB exception:', dbError);
  }
}

// =====================================================================
// Funções auxiliares
// =====================================================================

function sendCallResult(ws, messageId, payload) {
  const message = [3, messageId, payload];
  ws.send(JSON.stringify(message));
}

function sendCallError(ws, messageId, errorCode, errorDescription) {
  const message = [4, messageId, errorCode, errorDescription, {}];
  ws.send(JSON.stringify(message));
}

async function updateChargerStatus(chargePointId, status, ocppStatus) {
  try {
    await supabase
      .from('chargers')
      .update({ status, ocpp_protocol_status: ocppStatus })
      .eq('ocpp_charge_point_id', chargePointId);
  } catch (e) {
    console.error('[updateChargerStatus] Error:', e?.message);
  }
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
