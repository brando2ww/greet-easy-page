

## Plano: corrigir falso “carregando” e destravar carga real no XIRU

O cronômetro começou porque a última correção ativou a sessão quando o XIRU enviou `Preparing`. Isso confirmou que o plugue foi detectado, mas **`Preparing` não significa que energia está fluindo**. Em OCPP 1.6J, carga real só deve começar quando houver `StartTransaction`, `Charging` real, ou telemetria com energia/potência.

Pelos dados atuais:
- Sessão `1c4a228a...` terminou `completed`, mas com `transaction_id = null`.
- Não há nenhum `meter_values` para a sessão.
- O carregador está com `ocpp_protocol_status = Charging`, mas `last_heartbeat` está antigo.
- Isso indica estado inconsistente/zumbi: a UI entrou em modo ativo, mas o carregador não confirmou transação nem enviou medição.

## O que vou fazer

### 1. Reverter o falso início em `Preparing`

Em `ocpp-standalone-server/server.js`, ajustar `handleStatusNotification`:

- `Preparing` não vai mais mudar `charging_sessions.status` para `in_progress`.
- `Preparing` vai apenas marcar que o plugue foi detectado no carregador.
- A sessão continua em `awaiting_plug` até chegar confirmação real.

Novo comportamento:

```text
StatusNotification(Preparing)
→ plugue detectado
→ manter sessão awaiting_plug
→ não iniciar cronômetro
→ não iniciar cobrança
```

### 2. Iniciar sessão somente com evento real de carga

A sessão só vira `in_progress` quando acontecer pelo menos um destes eventos:

```text
StartTransaction
ou
StatusNotification(Charging)
ou
MeterValues com transactionId válido
```

Detalhes:
- `handleStartTransaction` continua respondendo imediatamente `Accepted`.
- Se existir sessão `awaiting_plug`, vincula `transaction_id`, `meter_start` e muda para `in_progress`.
- Se vier `Charging` sem `StartTransaction`, só ativa se já houver `transaction_id` ou telemetria confiável.
- Se vier `MeterValues` com `transactionId`, vincula/atualiza a sessão e confirma carga real.

### 3. Corrigir o estado visual da tela de carregamento

Em `src/pages/Carregamento.tsx`:

- Quando a sessão estiver `awaiting_plug` e o OCPP estiver `Preparing`, mostrar:

```text
Plugue detectado
Aguardando o carregador liberar energia...
```

- O cronômetro de carga não roda nesse estado.
- Custo e kWh permanecem zerados.
- A barra/progresso não simula carga sem SoC ou meter values.

Estados esperados na UI:

```text
awaiting_plug + Available/Preparing
→ aguardando / plugue detectado

in_progress + StartTransaction/MeterValues
→ cronômetro rodando / carregando

completed/cancelled
→ finalizado
```

### 4. Fazer `RemoteStartTransaction` retornar `Accepted` ou `Rejected` real

Hoje `/api/remote-start` só responde “enviei”, sem esperar o carregador responder. Vou mudar o servidor OCPP para:

- Registrar o `messageId` em `pendingCalls`.
- Enviar `RemoteStartTransaction`.
- Esperar `CALLRESULT`.
- Retornar ao Edge Function:

```json
{
  "success": true,
  "status": "Accepted"
}
```

ou

```json
{
  "success": false,
  "status": "Rejected"
}
```

Assim saberemos se o XIRU realmente aceitou iniciar ou se apenas recebeu a mensagem.

### 5. Corrigir `charger-commands` para lidar com rejeição real

Em `supabase/functions/charger-commands/index.ts`:

- Se `RemoteStartTransaction` voltar `Rejected`, cancelar a sessão recém-criada.
- Mostrar mensagem clara ao usuário/admin:

```text
O carregador rejeitou o início remoto.
Possível causa: autorização local/RFID ou configuração AuthorizeRemoteTxRequests.
```

- Se voltar `Accepted`, manter `awaiting_plug` até `StartTransaction` ou carga real.

### 6. Adicionar botão admin para ação de desbloqueio imediato

No `AdminDiagnosticsPanel`, adicionar ações úteis para o XIRU:

- `Ler config`
- `AuthRemoteTx=false`
- `Trigger StatusNotification`
- `Trigger MeterValues`
- `Soft Reset`

Se o XIRU aceitou `RemoteStart` mas não envia `StartTransaction`, o próximo passo será:
1. Ler `AuthorizeRemoteTxRequests`.
2. Se estiver `true`, mudar para `false`.
3. Se retornar `RebootRequired`, enviar `Soft Reset`.
4. Tentar iniciar novamente.

### 7. Ajustar limpeza de estado inconsistente

No servidor e na Edge Function:

- Se a sessão for parada/cancelada sem `transaction_id`, resetar o charger para:
  - `status = available`
  - manter `ocpp_protocol_status` conforme último status real, mas sem considerar isso uma sessão ativa.
- Evitar que o app veja `Charging` antigo/stale como carga real se o heartbeat estiver velho.

## Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `ocpp-standalone-server/server.js` | Não ativar `in_progress` em `Preparing`; iniciar só com `StartTransaction`/carga real; `remote-start` com resposta real |
| `supabase/functions/charger-commands/index.ts` | Cancelar sessão se RemoteStart for rejeitado; mensagens claras |
| `src/pages/Carregamento.tsx` | Mostrar “Plugue detectado” sem rodar cronômetro até carga real |
| `src/components/charging/AdminDiagnosticsPanel.tsx` | Botões de Trigger MeterValues, Soft Reset e config para desbloqueio |
| `src/services/api.ts` | Tipos/actions para novos comandos de diagnóstico se necessário |

## O que NÃO vou fazer

- Não vou cobrar nem iniciar cronômetro apenas por `Preparing`.
- Não vou depender de status OCPP stale com heartbeat antigo.
- Não vou esconder o problema com UI; a tela vai diferenciar plugue conectado de carga real.

## Resultado esperado

Na próxima tentativa:

1. Usuário inicia pelo app.
2. XIRU recebe `RemoteStartTransaction`.
3. Se rejeitar, o app mostra erro real.
4. Se aceitar e plugue estiver conectado:
   - `Preparing` mostra “Plugue detectado”.
   - Cronômetro ainda não roda.
5. Quando o XIRU enviar `StartTransaction` ou `MeterValues`, a sessão vira `in_progress`.
6. Só então cronômetro, custo e kWh começam.

