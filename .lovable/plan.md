

## Plano: aplicar protocolo OCPP 1.6 corretamente para destravar o XIRU

Após ler a spec oficial OCPP 1.6 (OASIS) e OCPP-J 1.6 (OCA), descobri que **algumas hipóteses anteriores eram erradas** e a causa real do silêncio do XIRU é provavelmente uma combinação de configuração `AuthorizeRemoteTxRequests` + payload do `RemoteStartTransaction` não-conforme.

## Descobertas oficiais da spec

| Item | Spec oficial | Implicação |
|---|---|---|
| `connectorId` em `RemoteStartTransaction.req` | **SHALL be > 0** (seção 6.33) | Hipótese anterior de testar `connectorId: 0` está **errada** — XIRU rejeitaria como inválido |
| `AuthorizeRemoteTxRequests` (config padrão) | Se `true`, CP envia `Authorize.req` antes de iniciar transação (seção 5.11) | Se nosso servidor responde lento/errado ao `Authorize`, fluxo trava sem erro visível |
| Transição A2 (Available→Preparing) | Disparada por "receipt of a RemoteStartTransaction.req" entre outros (seção 4.7) | XIRU deveria mudar para `Preparing` ao receber RemoteStart — não está fazendo, indica rejeição interna |
| `TriggerMessage.req` connectorId | **> 0** ou omitido (significa "todos os conectores + main") | Para forçar status do conector 1, mandar `connectorId: 1`. Para diagnóstico amplo, omitir. |
| `MinimumStatusDuration` | Pode atrasar `StatusNotification.req` propositalmente | Setar para `0` durante diagnóstico |

## O que vou fazer (em ordem)

### 1. Validar conexão e ler buffer real do XIRU

- Chamar `ocpp-diagnostics` action `connections` → confirma se XIRU está na lista de WebSockets ativos do servidor.
- Chamar action `messages` para `cp=140515` → ver tudo que o XIRU enviou/recebeu nos últimos minutos. Esta é a fonte primária de verdade — sem isto estamos chutando.

### 2. Forçar `TriggerMessage(StatusNotification)` sem connectorId

Chamada `trigger` **omitindo `connectorId`** (interpretado como "para todos os conectores + main"). XIRU deve responder com:
- `TriggerMessage.conf` com `status: Accepted` (ou `Rejected`/`NotImplemented`).
- Em seguida, múltiplos `StatusNotification.req` (um por conector + um para id 0).

Isto nos diz o status real interno do XIRU **agora**, sem ambiguidade.

### 3. Ler configuração `AuthorizeRemoteTxRequests` do XIRU

Adicionar nova action no servidor OCPP: **`GetConfiguration`** (mensagem OCPP padrão).

- Endpoint `POST /api/get-configuration` no `ocpp-standalone-server/server.js`.
- Recebe `{ chargePointId, key: ['AuthorizeRemoteTxRequests', 'MinimumStatusDuration', 'AuthorizationCacheEnabled', 'LocalAuthListEnabled', 'StopTransactionOnEVSideDisconnect'] }`.
- Encaminha como CALL OCPP `[2, msgId, "GetConfiguration", { key: [...] }]`.
- Edge function `ocpp-diagnostics` ganha action `getConfig`.

Saber esses valores diz exatamente o caminho a tomar:

| `AuthorizeRemoteTxRequests` | Diagnóstico | Próximo passo |
|---|---|---|
| `true` | XIRU espera autorizar idTag antes de iniciar | Verificar se `Authorize.req` chega ao servidor; garantir resposta `Accepted` rápida |
| `false` | XIRU deveria iniciar direto | Bug é outro — investigar handlers internos |

### 4. Forçar `AuthorizeRemoteTxRequests = false` se preciso

Se diagnóstico mostrar `true` e estiver travando no Authorize:

- Endpoint `POST /api/change-configuration` no servidor OCPP.
- Envia CALL `[2, msgId, "ChangeConfiguration", { key: "AuthorizeRemoteTxRequests", value: "false" }]`.
- Após XIRU responder `Accepted`, refazer RemoteStart.

### 5. Garantir resposta correta ao `Authorize.req` do XIRU

Inspecionar `ocpp-standalone-server/server.js` handler de `Authorize` (linha ~435 hoje, retorna `Accepted` cego). Confirmar:
- Resposta no formato exato: `[3, msgId, { idTagInfo: { status: "Accepted" } }]`.
- Sem campos extras que firmwares estritos rejeitem.
- Resposta enviada **imediatamente**, antes de qualquer DB I/O (mesmo padrão do `BootNotification`, já documentado em `mem://decisoes-tecnicas/garantia-resposta-bootnotification`).

### 6. Corrigir payload do `RemoteStartTransaction.req` no servidor

Inspecionar atual em `server.js` (~linha 82 conforme buffer mental). Garantir conformidade com spec 6.33:
- `connectorId` é **opcional** mas **se enviado deve ser > 0**. Hoje envia `1` que é correto. **Manter.**
- `idTag` obrigatório, IdToken (string até 20 chars). Verificar se nosso idTag (provavelmente `user_id` UUID) cabe e é aceito pelo XIRU.
- `chargingProfile` opcional. Não enviar.
- Verificar que NÃO enviamos campos extras (alguns firmwares rejeitam por strict schema).

Se o `idTag` for muito longo (UUID = 36 chars > limite IdToken de 20), o XIRU rejeita silenciosamente. **Provável causa raiz.** Se for o caso:
- Truncar/hashear para ≤20 chars determinísticos por usuário.
- Ou usar um `idTag` curto fixo como `"REMOTE"` para sessões iniciadas pelo app, e mapear sessão por `transactionId` posterior.

### 7. Atualizar UI para mostrar diagnóstico ao admin

Em `src/pages/Carregamento.tsx`, no alerta de timeout `awaiting_plug`, adicionar (apenas para admin, via `useUserRole`):
- Botão "Ver buffer OCPP" → modal mostrando últimas 50 mensagens do CP.
- Botão "Ler config XIRU" → mostra `AuthorizeRemoteTxRequests`, `MinimumStatusDuration`, etc.
- Botão "Trocar para AuthorizeRemoteTxRequests=false" → executa `ChangeConfiguration`.

Para usuário comum, manter apenas "Forçar verificação" e "Cancelar sessão".

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `ocpp-standalone-server/server.js` | + endpoints `/api/get-configuration`, `/api/change-configuration`. Validar handler `Authorize` responde rápido e em formato estrito. |
| `supabase/functions/ocpp-diagnostics/index.ts` | + actions `getConfig`, `changeConfig` |
| `supabase/functions/charger-commands/index.ts` | Validar `idTag` ≤20 chars no payload do RemoteStart; truncar/hashear se preciso |
| `src/pages/Carregamento.tsx` | + painel admin com 3 botões de diagnóstico (modal de buffer, ler config, trocar config) |
| `src/services/api.ts` | + `commandsApi.getConfig()`, `commandsApi.changeConfig()` |

## O que NÃO vou fazer (corrigindo plano anterior)

- **Não vou** testar `connectorId: 0` no RemoteStart — spec proíbe (`connectorId SHALL be > 0`).
- **Não vou** mexer em handlers que funcionam para o ZETA UNO.
- **Não vou** alterar subprotocolo nem handshake (XIRU já conecta).

## Próximos passos após implementação

1. Você roda `cd /opt/ocpp-server && git pull && systemctl restart ocpp-server` no Droplet.
2. Eu chamo `getConfig` para ler `AuthorizeRemoteTxRequests` e cia do XIRU.
3. Eu chamo `messages` para ver o buffer real do que XIRU disse.
4. Conforme valor de `AuthorizeRemoteTxRequests` + tamanho do idTag, aplicamos correção: ou trocar config para `false`, ou encurtar idTag, ou ambos.
5. Refazer teste do plug.

## Documentação consultada

- OCPP 1.6 (OASIS, FINAL 2015-10-08): seções 4.7 (StatusNotification + máquina de estados), 5.11 (RemoteStart), 5.17 (TriggerMessage), 6.33 (RemoteStartTransaction.req schema), 6.51 (TriggerMessage.req schema).
- OCPP-J 1.6 Specification (Open Charge Alliance): handshake WebSocket, formato CALL/CALLRESULT/CALLERROR.

