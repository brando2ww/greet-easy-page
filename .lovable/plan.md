

## Usar Dados Reais no Grafico e Comparativo da Tela de Carregamento

### O que muda

O grafico de barras semanal e o texto "12% menos energia" atualmente usam dados inventados. Vamos buscar o historico real de sessoes do usuario no servidor e exibir os dados verdadeiros.

### Como vai funcionar

1. O servidor vai receber uma nova acao (`weeklyStats`) que retorna o consumo de energia do usuario nos ultimos 7 dias, agrupado por dia, e tambem o total do periodo anterior (7 dias antes) para calcular a comparacao real.

2. A tela de carregamento vai chamar essa nova acao e alimentar o grafico e o texto comparativo com os dados reais.

Se nao houver dados suficientes, o grafico mostrara barras zeradas nos dias sem sessoes (comportamento honesto).

### Detalhes Tecnicos

**Arquivo 1: `supabase/functions/transactions-api/index.ts`**

Adicionar um novo case `weeklyStats` no switch:

- Busca sessoes dos ultimos 7 dias (`completed` ou `in_progress`) do usuario
- Agrupa por dia e soma `energy_consumed`
- Busca tambem sessoes dos 7 dias anteriores para calcular a variacao percentual
- Retorna:
```json
{
  "dailyData": [
    { "date": "2026-02-04", "dayLabel": "Ter", "energy": 5.2 },
    { "date": "2026-02-05", "dayLabel": "Qua", "energy": 0 },
    ...
  ],
  "currentPeriodTotal": 12.5,
  "previousPeriodTotal": 14.2,
  "changePercent": -12
}
```

**Arquivo 2: `src/services/api.ts`**

Adicionar metodo `transactionsApi.weeklyStats()` que chama a nova acao.

**Arquivo 3: `src/pages/Carregamento.tsx`**

- Substituir o `useMemo` com dados mock por um `useQuery` que chama `transactionsApi.weeklyStats()`
- Alimentar o `chartData` com `dailyData` real
- Substituir o texto hardcoded "12% menos" pelo `changePercent` real, mostrando "X% menos" ou "X% mais" conforme o valor
- Se nao houver dados, mostrar texto como "Sem dados anteriores para comparar"

