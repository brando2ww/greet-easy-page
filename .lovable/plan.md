

## Progresso real baseado em dados OCPP

### Problema atual
O círculo de progresso na página de carregamento usa uma animação falsa (`p + 0.003` a cada 100ms). Os dados reais de SoC (State of Charge / nível da bateria) já chegam via OCPP MeterValues e são salvos na tabela `meter_values`, mas **não são propagados** para a sessão nem para o frontend.

### Como os dados chegam hoje
1. O carregador envia `MeterValues` via OCPP com `sampledValue` contendo measurands como `Energy.Active.Import.Register`, `SoC`, `Voltage`, `Current.Import`, etc.
2. O servidor OCPP (`ocpp-standalone-server/server.js`) salva tudo na tabela `meter_values` e atualiza `energy_consumed` e `cost` na sessão — **mas ignora o SoC**
3. O frontend consulta a sessão a cada 10s, mas não recebe SoC

### Solução em 3 camadas

#### 1. Servidor OCPP — propagar SoC para a sessão
**`ocpp-standalone-server/server.js`** (função `handleMeterValues`):
- Capturar o measurand `SoC` além do `Energy.Active.Import.Register`
- Atualizar o campo `soc` na tabela `charging_sessions` junto com `energy_consumed` e `cost`

#### 2. Banco de dados — adicionar coluna `soc`
**Nova migração SQL**:
- Adicionar coluna `soc integer` à tabela `charging_sessions` (porcentagem 0-100, nullable)

#### 3. Edge Function — retornar SoC na API
**`supabase/functions/transactions-api/index.ts`**:
- Incluir `soc` no select da sessão
- Mapear para `soc` no objeto Transaction retornado

#### 4. Frontend — usar SoC real no progresso
**`src/types/charger.ts`**:
- Adicionar `soc: number | null` aos tipos `Transaction`, `ChargingSessionRow` e mapper

**`src/pages/Carregamento.tsx`**:
- Substituir a animação falsa por `session?.soc ?? 0` (valor 0-100)
- Converter para fração (0-1) para o `strokeDashoffset` do SVG
- Mostrar porcentagem real no display
- Manter animação suave com `transition-all duration-1000`
- Fallback: se SoC for null (carregador não envia), usar progresso baseado em energia consumida vs capacidade estimada, ou exibir "--%" com animação de pulso

### Arquivos editados
- `ocpp-standalone-server/server.js`
- Nova migração SQL (coluna `soc`)
- `supabase/functions/transactions-api/index.ts`
- `src/types/charger.ts`
- `src/pages/Carregamento.tsx`

