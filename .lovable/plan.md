

# Corrigir erro "Cannot set property protocol" no servidor OCPP

## Problema

Os logs do Digital Ocean mostram o erro:
```
TypeError: Cannot set property protocol of #<WebSocket> which has only a getter
```

Isso acontece na linha `ws.protocol = selectedProtocol || '';` dentro do handler `server.on('upgrade')`. Na biblioteca `ws`, a propriedade `protocol` e somente leitura (getter). O servidor crasha antes de processar qualquer mensagem, por isso o BootNotification nunca recebe resposta.

## Solucao

Remover a linha `ws.protocol = selectedProtocol || '';` e passar o subprotocolo corretamente atraves do `WebSocketServer` usando a opcao `handleProtocols` no construtor, ou simplesmente remover o `noServer` e usar a opcao `server` diretamente com `handleProtocols`.

A abordagem mais simples: manter `noServer: true`, mas em vez de tentar setar `ws.protocol` manualmente, basta remover essa linha. O protocolo ja sera negociado automaticamente se passarmos as opcoes corretas no `handleUpgrade`.

## Alteracao no arquivo `ocpp-standalone-server/server.js`

### Opcao escolhida: Usar `handleProtocols` no construtor do WebSocketServer

Trocar:

```javascript
const wss = new WebSocketServer({ noServer: true });
```

Por:

```javascript
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
```

E no handler de `upgrade`, remover a linha problematica:

```javascript
// REMOVER esta linha:
ws.protocol = selectedProtocol || '';

// E simplificar o upgrade handler para:
server.on('upgrade', (request, socket, head) => {
  console.log(`[WebSocket Upgrade] URL: ${request.url}`);
  console.log(`[WebSocket Upgrade] Protocol: ${request.headers['sec-websocket-protocol'] || 'none'}`);
  console.log(`[WebSocket Upgrade] From: ${request.socket.remoteAddress}`);

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});
```

A negociacao de subprotocolo sera feita automaticamente pelo `handleProtocols` do construtor.

## Resultado esperado

1. O servidor inicia sem erros
2. `wscat` conecta com subprotocolo `ocpp1.6`
3. BootNotification recebe resposta `[3,"test-001",{"status":"Accepted",...}]`
4. Sem mais `TypeError` nos logs

