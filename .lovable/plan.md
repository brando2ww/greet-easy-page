

## Substituir logo na página Estações

O usuário quer trocar o logo atual pelo novo upload (versão preta do nexcharge).

### Mudanças

1. **Copiar** `user-uploads://Design_sem_nome_11.png` para `src/assets/nexcharge-logo.png` (sobrescrever o existente)

O import em `src/pages/Estacoes.tsx` já aponta para este arquivo, então a troca será automática.

