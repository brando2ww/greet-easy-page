## Objetivo

O XIRU aceita `RemoteStartTransaction` mas não libera corrente. Hoje o `server.js` já envia um `chargingProfile`, mas em **Watts** (`limit: 40000 W`). Muitos firmwares chineses só "destravam o contator" quando recebem o limite em **Amperes** (`A`), igual fazem Evolt/EVSE profissionais.

## Mudança

Em `ocpp-standalone-server/server.js`, no endpoint `POST /api/remote-start` (e no `SetChargingProfile` redundante 1.5s depois), trocar a unidade do `chargingSchedule`:

- `chargingRateUnit`: `'W'` → `'A'`
- `limit`: `Math.round(powerKw * 1000)` → **32** (corrente padrão segura para AC/DC trifásico; XIRU 40 kW opera tipicamente em 32 A nominal por fase no DC controller)

Aplicar tanto no `payload` inline do `RemoteStartTransaction` (linhas ~157–170) quanto no `SetChargingProfile` redundante (linhas ~178–200).

## Detalhes técnicos

```js
// /api/remote-start
const payload = {
  connectorId,
  idTag: idTag || 'REMOTE',
  chargingProfile: {
    chargingProfileId: 1,
    stackLevel: 0,
    chargingProfilePurpose: 'TxProfile',
    chargingProfileKind: 'Relative',
    chargingSchedule: {
      chargingRateUnit: 'A',
      chargingSchedulePeriod: [{ startPeriod: 0, limit: 32 }],
    },
  },
};

// SetChargingProfile redundante (1.5s depois)
csChargingProfiles: {
  chargingProfileId: 1,
  stackLevel: 0,
  chargingProfilePurpose: 'TxDefaultProfile',
  chargingProfileKind: 'Relative',
  chargingSchedule: {
    chargingRateUnit: 'A',
    chargingSchedulePeriod: [{ startPeriod: 0, limit: 32 }],
  },
},
```

A leitura de `power` da tabela `chargers` deixa de ser usada para o limite (o XIRU faz seu próprio derate interno). Mantemos o lookup só por logging futuro? **Não** — removemos para simplificar.

## Pós-deploy (manual no Droplet)

1. `cd /opt/ocpp-server && git pull`
2. `systemctl restart ocpp-server`
3. Religar o XIRU, iniciar sessão pelo app
4. Confirmar nos logs que o payload de saída agora mostra `"chargingRateUnit":"A"` e `"limit":32`
5. Verificar se `MeterValues` passa a reportar `Power.Active.Import > 0`

## Fora de escopo

- Nenhuma mudança no frontend ou em Edge Functions
- Nenhuma mudança em DB / migrations
- Banner de "carga sem energia" no `Carregamento.tsx` permanece como salvaguarda