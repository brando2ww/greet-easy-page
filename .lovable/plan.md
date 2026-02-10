

## Correcoes no Servidor OCPP - Problemas Identificados

### Problema 1: Conflito entre HTTP handler e WebSocket upgrade

O servidor HTTP tem um handler catch-all na linha 124-126 que retorna 404 para qualquer rota nao mapeada. Quando o Zeta Uno tenta conectar via `wss://domain/ocpp/140414`, o handler HTTP pode interceptar o request antes do upgrade WebSocket acontecer, respondendo com 404.

A biblioteca `ws` escuta o evento `upgrade` no servidor HTTP, mas se o request HTTP for processado primeiro pelo handler `request`, o upgrade nunca acontece.

### Problema 2: Matching de subprotocolo pode falhar

O Zeta Uno pode enviar variacoes do nome do protocolo (ex: `ocpp1.6j`, `OCPP1.6`, `ocpp16`). O codigo atual faz match exato com `ocpp1.6`, o que pode nao corresponder ao que o carregador envia.

### Problema 3: Falta de logging na fase de upgrade

Nao ha logs para quando uma tentativa de conexao WebSocket e rejeitada antes de chegar ao handler `connection`. Isso dificulta diagnosticar o problema.

---

### Solucao

Modificar `ocpp-standalone-server/server.js` com as seguintes alteracoes:

1. **Adicionar handler explicito para o evento `upgrade`** no servidor HTTP, garantindo que conexoes WebSocket nao sejam bloqueadas pelo handler HTTP 404.

2. **Tornar o matching de subprotocolo mais flexivel**, aceitando variacoes como `ocpp1.6j`, `ocpp1.6J`, case-insensitive.

3. **Adicionar logs detalhados** no evento `upgrade` para diagnosticar exatamente o que o Zeta Uno envia.

4. **Aceitar conexoes mesmo sem subprotocolo** (retornar string vazia ao inves de `false` no `handleProtocols`), para nao rejeitar o carregador caso o protocolo nao case exatamente.

### Detalhes Tecnicos

**Arquivo:** `ocpp-standalone-server/server.js`

**Alteracao 1** - Adicionar log no evento `upgrade` do servidor HTTP (apos `server.listen`):

```javascript
server.on('upgrade', (request, socket, head) => {
  console.log(`[WebSocket Upgrade] URL: ${request.url}`);
  console.log(`[WebSocket Upgrade] Protocol: ${request.headers['sec-websocket-protocol']}`);
  console.log(`[WebSocket Upgrade] From: ${request.socket.remoteAddress}`);
});
```

**Alteracao 2** - Tornar `handleProtocols` mais flexivel (case-insensitive e aceitando variacoes):

```javascript
handleProtocols: (protocols, request) => {
  console.log(`[WebSocket] Requested protocols:`, Array.from(protocols));
  const protocolList = Array.from(protocols).map(p => p.toLowerCase());
  
  // Accept OCPP 1.6 variants (ocpp1.6, ocpp1.6j, etc.)
  const ocpp16 = protocolList.find(p => p.startsWith('ocpp1.6'));
  if (ocpp16) return ocpp16;
  
  const ocpp15 = protocolList.find(p => p.startsWith('ocpp1.5'));
  if (ocpp15) return ocpp15;
  
  const ocpp20 = protocolList.find(p => p.startsWith('ocpp2.0'));
  if (ocpp20) return ocpp20;
  
  // Accept any protocol that contains 'ocpp'
  const anyOcpp = protocolList.find(p => p.includes('ocpp'));
  if (anyOcpp) return anyOcpp;
  
  // Don't reject - accept without subprotocol
  console.log('[WebSocket] No OCPP protocol found, accepting anyway');
  return false;
},
```

**Alteracao 3** - Separar o WebSocket do servidor HTTP para ter controle total sobre o upgrade:

Ao inves de `new WebSocketServer({ server })`, usar `new WebSocketServer({ noServer: true })` e fazer o upgrade manualmente. Isso garante que o handler HTTP 404 nunca interfira com conexoes WebSocket:

```javascript
const wss = new WebSocketServer({ 
  noServer: true,
  // handleProtocols nao se aplica em modo noServer
});

server.on('upgrade', (request, socket, head) => {
  console.log(`[WebSocket Upgrade] URL: ${request.url}`);
  console.log(`[WebSocket Upgrade] Protocol: ${request.headers['sec-websocket-protocol']}`);
  console.log(`[WebSocket Upgrade] From: ${request.socket.remoteAddress}`);
  
  // Negociar subprotocolo manualmente
  const requestedProtocols = (request.headers['sec-websocket-protocol'] || '')
    .split(',').map(p => p.trim().toLowerCase());
  
  let selectedProtocol = null;
  for (const p of requestedProtocols) {
    if (p.startsWith('ocpp')) {
      selectedProtocol = p;
      break;
    }
  }
  
  console.log(`[WebSocket Upgrade] Selected protocol: ${selectedProtocol || 'none'}`);
  
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
```

Essa abordagem com `noServer: true` e a mais robusta porque:
- Garante que o upgrade WebSocket NUNCA e interceptado pelo handler HTTP
- Permite negociar o subprotocolo manualmente com total flexibilidade
- Adiciona logs em cada etapa da conexao

### Resultado Esperado

Apos o deploy, o Zeta Uno devera conectar com sucesso. Os logs mostrarao exatamente qual URL e protocolo o carregador esta enviando, facilitando qualquer diagnostico adicional.
