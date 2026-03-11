

## Dados de Consumo Reais + Mock para Sessões Existentes

### Contexto
- 8 sessões existentes, todas com `energy_consumed`, `cost`, `meter_start`, `meter_stop` = null
- O `handleMeterValues` no OCPP server apenas loga e descarta os dados
- O `handleStopTransaction` já calcula energia/custo a partir de meter_start/meter_stop — funciona, mas depende do carregador enviar esses valores
- Carregador: 7kW, R$ 0,80/kWh

### O que será feito

**1. Criar tabela `meter_values`** para armazenar leituras OCPP em tempo real:
- `id`, `session_id` (FK charging_sessions), `transaction_id`, `timestamp`, `connector_id`
- `measurand` (Energy.Active.Import.Register, Power.Active.Import, Voltage, Current.Import, Temperature, SoC)
- `value` (numeric), `unit` (Wh, W, V, A, Celsius, Percent)
- `phase` (L1, L2, L3, null)
- RLS: admin pode ler tudo, usuário pode ler as suas (via session)

**2. Atualizar OCPP server** (`ocpp-standalone-server/server.js`):
- `handleMeterValues`: parsear o payload OCPP 1.6 (array de `meterValue` com `sampledValue`) e salvar cada valor na tabela `meter_values`
- Também atualizar `energy_consumed` na sessão ativa quando receber Energy.Active.Import.Register (para ter dados em tempo real na tela de carregamento)

**3. Popular sessões existentes com dados mock realistas**:
- Calcular energia baseada na duração e potência do carregador (7kW × horas × fator aleatório)
- Calcular custo: energia × R$ 0,80/kWh
- Usar INSERT tool para fazer UPDATE nas 7 sessões completed
- Fechar a sessão "in_progress" órfã como completed

**4. Atualizar `handleStartTransaction`** no OCPP server:
- Vincular a sessão ao `user_id` real (do `id_tag`) em vez de usar UUID zerado

### Arquivos

| Ação | Arquivo |
|------|---------|
| Migration | Criar tabela `meter_values` |
| Data update | UPDATE nas 8 sessões existentes com energia/custo mock |
| Editar | `ocpp-standalone-server/server.js` — handleMeterValues salva dados, handleStartTransaction vincula user_id |

### Dados mock para sessões existentes

Baseado na duração real de cada sessão e potência de 7kW:

| Sessão | Duração | Energia (kWh) | Custo (R$) |
|--------|---------|---------------|------------|
| c92f09f5 | 9min | 1.05 | 0.84 |
| c09ed1b3 | 11min | 1.28 | 1.02 |
| 78b60b9e | 4min | 0.47 | 0.38 |
| 55f3e10b | in_progress (órfã) | 0.35 | 0.28 |
| 31418a04 | 2min | 0.23 | 0.18 |
| b0097e6d | 2min | 0.23 | 0.18 |
| 2e547d1f | 2min | 0.23 | 0.18 |
| de6cb555 | 7h20min | 12.50 | 10.00 |

### Estrutura da tabela meter_values

```sql
CREATE TABLE public.meter_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.charging_sessions(id) ON DELETE CASCADE,
  transaction_id integer,
  timestamp timestamptz NOT NULL DEFAULT now(),
  connector_id integer,
  measurand text NOT NULL DEFAULT 'Energy.Active.Import.Register',
  value numeric NOT NULL,
  unit text NOT NULL DEFAULT 'Wh',
  phase text,
  context text DEFAULT 'Sample.Periodic',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: admin full access, users via session ownership
```

