

## Atualizar `RAILWAY_INTERNAL_KEY` com o novo valor

Você gerou uma nova chave. Para sincronizar os dois projetos, vou atualizar o secret `RAILWAY_INTERNAL_KEY` aqui no Nexcharge com o valor que você fornecer.

## Passos

1. **Você cola o novo valor no chat** (apenas o valor, ex: `a1b2c3d4...`)
2. **Eu atualizo o secret `RAILWAY_INTERNAL_KEY`** neste projeto via ferramenta de secrets — o valor fica encriptado, não aparece em código nem em logs
3. **Você cola o mesmo valor no painel admin externo** no campo correspondente (`NEXCHARGE_SERVICE_ROLE_KEY` ou similar)
4. **Testa** criando um carregador pelo painel admin — o erro 403 deve sumir

## Segurança da chave no chat

Colar o valor no chat é seguro neste fluxo: ele vai direto para o secret encriptado do Supabase e não fica em nenhum arquivo do código. Mesmo assim, depois de configurado dos dois lados, você pode rotacionar novamente se preferir.

## O que NÃO muda

- Nenhum arquivo de código (`chargers-api` já está pronto desde a mudança anterior)
- Nenhuma tabela ou migração
- Nenhuma configuração de RLS

## Próxima ação

Cole no chat o novo valor da chave que você gerou. Assim que receber, atualizo o secret e confirmo.

