

## Mostrar Status Real do Plugue na Tela de Carregamento

### Problema
O texto "Plugue Conectado" na linha 125 e hardcoded -- sempre aparece independentemente de o cabo estar realmente conectado ao carro. O status real do conector vem do protocolo OCPP e esta disponivel no banco de dados (`ocpp_protocol_status`), mas a tela nao consulta essa informacao.

### Como vai funcionar
A tela vai consultar o status OCPP real do carregador a cada 10 segundos (mesmo intervalo do polling da sessao). O texto vai mudar dinamicamente conforme o estado real:

| Status OCPP       | Texto exibido         | Indicador  |
|--------------------|-----------------------|------------|
| Available          | Aguardando plugue     | Amarelo    |
| Preparing          | Preparando...         | Amarelo    |
| Charging           | Plugue Conectado      | Verde      |
| SuspendedEVSE      | Pausado (Estacao)     | Amarelo    |
| SuspendedEV        | Pausado (Veiculo)     | Amarelo    |
| Finishing          | Finalizando...        | Azul       |
| Faulted            | Erro no carregador    | Vermelho   |
| Unavailable        | Indisponivel          | Vermelho   |
| (outro/null)       | Conectando...         | Cinza      |

### Mudancas Tecnicas

**Arquivo: `src/pages/Carregamento.tsx`**

1. Adicionar um `useQuery` que chama `commandsApi.getStatus(chargerId)` com `refetchInterval: 10000` (poll a cada 10s)
2. Extrair o `chargerId` de `chargerFromState?.id` ou `session?.chargerId`
3. Substituir o texto hardcoded "Plugue Conectado" por um mapeamento do `ocppStatus` real para labels em portugues
4. Ajustar a cor do indicador pulsante conforme o status (verde para Charging, amarelo para Preparing, etc.)
5. Se a sessao estiver completed, continuar mostrando "Finalizado" como ja faz

Nenhuma mudanca no backend -- o endpoint `charger-commands` com action `status` ja retorna o `ocppStatus` real.
