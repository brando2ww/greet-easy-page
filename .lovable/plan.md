## Diagnóstico

Fluxo OCPP 1.6J completo está conforme spec — o XIRU 40 kW reportou tudo certinho:

```
BootNotification ✅ Accepted
StatusNotification ✅ Available → Preparing → Charging
RemoteStartTransaction ✅ Accepted
StartTransaction ✅ Accepted (transactionId 1009)
MeterValues ✅ entregando a cada 20s
StopTransaction ✅ Accepted
```

**Mas:** `Power.Active.Import = 0.00 W` e medidor parado em `77825 Wh` do início ao fim. O charger "achou" que estava carregando, mas o contator/módulo de potência DC não liberou energia.

Como é um **carregador DC de 40 kW** (provavelmente CCS2 ou GB/T), há duas hipóteses de software que são MUITO comuns nesses chargers chineses (ZETAUNO/XIRU/Z1D60) e que valem testar antes de chamar técnico:

1. Firmware exige `chargingProfile` no `RemoteStartTransaction` — sem ele, alguns ficam em "Charging fictício".
2. Firmware exige resposta completa em `Authorize` (`expiryDate` + `parentIdTag`) para liberar o contator.

## Mudanças propostas

### 1. Servidor OCPP — `chargingProfile` no RemoteStart (DC, 40 kW)

`ocpp-standalone-server/server.js`, endpoint `/api/remote-start`:

```js
const payload = {
  connectorId,
  idTag: idTag || 'REMOTE',
  chargingProfile: {
    chargingProfileId: 1,
    stackLevel: 0,
    chargingProfilePurpose: 'TxProfile',
    chargingProfileKind: 'Relative',
    chargingSchedule: {
      chargingRateUnit: 'W',           // Watts (DC)
      chargingSchedulePeriod: [
        { startPeriod: 0, limit: 40000 } // 40.000 W = 40 kW
      ]
    }
  }
};
```

Para DC a unidade correta é `W` (não `A`). 40 kW = 40000 W.

### 2. Servidor OCPP — `SetChargingProfile` redundante após StartTransaction

1 segundo depois de aceitar o `StartTransaction`, mandar um `SetChargingProfile` separado no mesmo connector com o mesmo limite. Defesa em profundidade — se o profile do RemoteStart foi ignorado, este pega.

### 3. Servidor OCPP — `Authorize` com resposta completa

Atualmente `handleAuthorize` retorna só `{ status: 'Accepted' }`. Adicionar:

```js
sendCallResult(ws, messageId, {
  idTagInfo: {
    status: 'Accepted',
    expiryDate: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
    parentIdTag: payload.idTag
  }
});
```

### 4. App — detector "carga sem energia" em `src/pages/Carregamento.tsx`

Após 90s em status `Charging` com `Power.Active.Import` = 0 e `energyConsumed` = 0:

- Banner amarelo: "O carregador reporta que está carregando, mas nenhuma energia está fluindo. Verifique o cabo CCS/GB-T no veículo."
- Botões "Forçar verificação" e "Encerrar sessão"

Reaproveita o mesmo padrão visual do `awaitingPlugTimeout` que já existe.

### 5. Admin — mostrar potência instantânea no `AdminDiagnosticsPanel`

Card adicional "Última leitura de potência" lendo o `Power.Active.Import` mais recente de `meter_values`. Facilita identificar de longe sessões com Power=0.

## Atualizar configuração do carregador no DB

Confirmar/atualizar no registro do XIRU (cdbaf312…):

- `power_kw`: 40
- `connector_type`: CCS2 ou GB/T (qual exatamente?)

Se ainda estiver com 7 kW (default antigo do app), precisa ajustar — isso afeta estimativa de custo na drawer e cálculo de saldo mínimo.

## O que NÃO muda

- Edge functions de auth/RLS — nada toca
- Fluxo `awaiting_plug` — igual
- Frontend de iniciar carga / scanner — igual

## Validação pós-deploy

1. Religar disjuntor do XIRU → confirmar reconexão (`journalctl -u ocpp-server -f`)
2. Iniciar uma carga real
3. Conferir nos logs se o `RemoteStartTransaction` agora vai com `chargingProfile { limit: 40000 W }`
4. Conferir nos `MeterValues` se `Power.Active.Import` > 0
5. Se ainda vier 0 após esses 3 ajustes, é definitivamente hardware (módulo de potência DC, contator, ou recusa do veículo). O banner do app já avisa o usuário.

## Observações finais

Se mesmo com tudo isso o `Power.Active.Import` continuar em 0, será necessária inspeção física no XIRU:

- Disjuntor de entrada AC trifásico fechado e com as 3 fases?
- Display do XIRU mostra alguma falha (E01, E02…)?
- Veículo aceita carga DC nessa estação? (alguns BMS recusam por temperatura/SOC)
- Contator DC faz "click" audível ao iniciar?

Posso prosseguir com as 5 mudanças?
