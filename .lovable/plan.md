

## Corrigir Negociacao do Subprotocolo OCPP 1.6 no Servidor WebSocket

### Problema Identificado

O carregador Zeta Uno envia o header `Sec-WebSocket-Protocol: ocpp1.6` ao conectar. O servidor WebSocket atual **nao negocia este subprotocolo**, fazendo o carregador rejeitar a conexao (OCPP vermelho).

Isso e um requisito obrigatorio da especificacao OCPP 1.6J (secao 3.1): o servidor DEVE responder com o subprotocolo aceito.

### Solucao

Adicionar o parametro `handleProtocols` na configuracao do WebSocketServer para aceitar o subprotocolo `ocpp1.6`.

### Detalhes Tecnicos

**Arquivo:** `ocpp-standalone-server/server.js`

Alterar a criacao do WebSocketServer (linha ~130) para incluir `handleProtocols`:

```javascript
const wss = new WebSocketServer({ 
  server,
  handleProtocols: (protocols, request) => {
    // Accept OCPP 1.6 subprotocol if requested
    if (protocols.has('ocpp1.6')) {
      return 'ocpp1.6';
    }
    if (protocols.has('ocpp1.5')) {
      return 'ocpp1.5';
    }
    if (protocols.has('ocpp2.0')) {
      return 'ocpp2.0';
    }
    // Accept connection even without OCPP subprotocol
    return false;
  },
  verifyClient: (info) => {
    console.log(`[WebSocket] Verify client from ${info.req.socket.remoteAddress}`);
    console.log(`[WebSocket] URL: ${info.req.url}`);
    console.log(`[WebSocket] Protocols: ${info.req.headers['sec-websocket-protocol'] || 'none'}`);
    return true;
  }
});
```

### Apos a Alteracao

1. Fazer deploy no Digital Ocean (commit + push)
2. O Zeta Uno deve conectar automaticamente -- o indicador OCPP deve ficar verde
3. Verificar em `https://ocpp-server-speed-z2xda.ondigitalocean.app/api/connections` que mostra `140414`

