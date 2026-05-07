## Novo fluxo: aguardar plug ANTES do RemoteStart

### Fluxo atual (com bug de timing)

```
QR scan → startCharge() → cria awaiting_plug + RemoteStart
                       ↘ Preparing pode chegar antes do INSERT no banco
                          → activate-on-Preparing falha → sessão fica órfã
```

### Fluxo novo

```
QR scan → tela "Conecte o plug"
       → polling em chargers.ocpp_protocol_status
       → quando = 'Preparing': habilita botão "Iniciar Carregamento"
       → user toca → startCharge() → awaiting_plug + RemoteStart
       → XIRU aceita → StartTransaction → in_progress (cronômetro)
```

A sessão só nasce DEPOIS que o Preparing já está persistido no banco. Elimina race condition.

### Mudanças por arquivo

#### 1. `src/hooks/useChargerValidation.tsx`
Parar de chamar `commandsApi.startCharge`. Após validar (charger existe, available, online, heartbeat fresco), apenas navegar para a nova tela passando o charger no state:

```ts
navigate(`/aguardando-plug/${charger.id}`, { state: { charger } });
```

Remover toda a lógica de tratamento de erro de `startCharge` (passa para a nova tela).

#### 2. Nova página `src/pages/AguardandoPlug.tsx`
Nova rota `/aguardando-plug/:chargerId`. Responsabilidades:

- Exibe nome do carregador + ilustração do carro + instrução "Conecte o plug ao seu veículo".
- Polling a cada 3s via `commandsApi.getStatus(chargerId)`:
  - `ocppStatus === 'Available'` → "Aguardando conexão do plug" (botão desabilitado)
  - `ocppStatus === 'Preparing'` → "Plug detectado!" (botão "Iniciar Carregamento" habilitado, com pulse)
  - `ocppStatus === 'Charging'` → carregamento já em andamento por outro caminho; redireciona para `/` com toast
  - heartbeat > 2min ou status inválido → mostrar alerta "Estação sem resposta" + botão "Voltar"
- Botão "Iniciar Carregamento":
  - chama `commandsApi.startCharge(chargerId)`
  - sucesso → `navigate('/carregamento/' + sessionId, { state: { charger, sessionId } })`
  - erro → toast com mensagem específica (insuficiência de saldo, offline, rejected, etc.) — copiar tratamento do hook atual
- Botão "Cancelar" no header → volta para `/`
- Timeout: se ficar 3min em `Available` (sem chegar Preparing), exibir alerta sugerindo verificar o plug.

#### 3. `src/App.tsx`
Adicionar a rota `/aguardando-plug/:chargerId` apontando para o novo componente, dentro do `ProtectedRoute`.

#### 4. `src/pages/Carregamento.tsx`
Limpeza pequena: remover o ramo `Preparing` do label inicial, pois quando essa página abrir já vamos estar pelo menos em `awaiting_plug` pós-RemoteStart, e Preparing aqui é só transição curta. Mantém o tratamento existente para robustez (sem mudança funcional necessária).

### O que NÃO muda

- **Backend (`charger-commands` start)**: continua igual. Cria `awaiting_plug` + RemoteStart sync. A diferença é que agora ele só é chamado quando o XIRU já está em `Preparing`.
- **OCPP server (`server.js`)**: nenhuma mudança. O `handleStatusNotification` já atualiza `chargers.ocpp_protocol_status` em todos os transitions — é exatamente isso que a nova tela poda. A lógica de "ativar awaiting_plug em Preparing/Charging" continua útil como fallback caso o XIRU emita outro Preparing após o RemoteStart.
- **Validação de saldo, heartbeat, status no edge function**: intacta.

### Validação pós-deploy

1. Sem deploy de servidor — é puramente frontend.
2. QR scan → deve abrir tela "Conecte o plug" com botão desativado.
3. Plugar o cabo no carro → em poucos segundos botão fica ativo (pulsando).
4. Tocar "Iniciar" → tela de carregamento abre com cronômetro `--:--:--` até StartTransaction → cronômetro começa.
5. Não deve mais ocorrer `stop_reason: "RemoteStart Unknown"` por race condition.

### Trade-offs

- **Ganho**: elimina o bug de Preparing-antes-da-sessão; UX fica explícita ("Conecte o plug" vs imediato).
- **Custo**: usuário tem um passo extra (precisa apertar "Iniciar" depois de plugar). Aceitável e consistente com Tesla/EVgo apps.
- **Fallback**: se o XIRU pular direto Available→Charging (raro, mas spec OCPP 1.6 permite), o usuário fica preso na tela "Aguardando plug". Mitigação: o polling também detecta `Charging` e nesse caso assumimos que outra sessão tomou o carregador — redirecionamos.

Confirma aplicação?
