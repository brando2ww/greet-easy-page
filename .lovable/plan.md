

## Corrigir Label do Status "Preparing" para "Aguardando plugue"

### Problema
Depois de iniciar uma sessao remota (RemoteStartTransaction), o carregador envia status OCPP `Preparing` -- que significa exatamente "transacao iniciada, aguardando o cabo ser conectado". O mapeamento atual mostra "Preparando..." para esse estado, mas o texto correto deveria ser **"Aguardando plugue"**, ja que e isso que o carregador esta esperando.

O status so vai mudar para `Charging` quando o cabo for efetivamente conectado ao carro.

### Solucao
Alterar o mapeamento do status `Preparing` no arquivo `src/pages/Carregamento.tsx`:

- **Antes:** `Preparing` -> "Preparando..." (amarelo)
- **Depois:** `Preparing` -> "Aguardando plugue" (amarelo, pulsando)

O status `Available` tambem pode significar "aguardando plugue" em outros contextos, mas apos um RemoteStart o carregador tipicamente vai direto para `Preparing`.

### Mudanca Tecnica

**Arquivo: `src/pages/Carregamento.tsx`** (funcao `getOcppStatusInfo`, linha ~20)

Alterar o case `Preparing` de:
```
case "Preparing":
  return { label: "Preparando...", color: "bg-yellow-500", pulse: true };
```
Para:
```
case "Preparing":
  return { label: "Aguardando plugue", color: "bg-yellow-500", pulse: true };
```

Mudanca de uma unica linha. Nenhuma outra alteracao necessaria.
