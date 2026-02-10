

## Atualizar Edge Function charger-commands para o novo servidor OCPP

### O que vai mudar

A Edge Function `charger-commands` precisa apontar para o novo servidor OCPP no Droplet Digital Ocean em `http://68.183.152.189:80` em vez da URL antiga.

### Passos

1. **Adicionar secret `RAILWAY_OCPP_URL`** no Supabase com o valor `http://68.183.152.189:80`
   - A Edge Function ja usa `Deno.env.get('RAILWAY_OCPP_URL')` para buscar a URL do servidor OCPP
   - Tambem usa `RAILWAY_INTERNAL_KEY` para autenticacao interna -- precisamos confirmar se esse secret esta configurado

2. **Atualizar a Edge Function** `charger-commands/index.ts`:
   - Renomear as variaveis de `RAILWAY_OCPP_URL` / `RAILWAY_INTERNAL_KEY` para nomes mais adequados como `OCPP_SERVER_URL` / `OCPP_INTERNAL_KEY` (opcional mas recomendado ja que nao e mais Railway)
   - Ajustar os endpoints de `/api/remote-start` e `/api/remote-stop` para os endpoints corretos do novo servidor: `/api/remote-start` e `/api/remote-stop` (devem ser os mesmos, pois o `server.js` usa esses paths)

### Detalhes tecnicos

A Edge Function atualmente referencia:
- `RAILWAY_OCPP_URL` -- URL base do servidor OCPP
- `RAILWAY_INTERNAL_KEY` -- chave para autenticacao entre a Edge Function e o servidor OCPP

Como o servidor `server.js` no Droplet nao valida `x-internal-key` (nao ha middleware de autenticacao no codigo), podemos simplificar removendo esse header ou manter para seguranca futura.

**Secrets a configurar no Supabase:**
- `OCPP_SERVER_URL` = `http://68.183.152.189:80`
- `OCPP_INTERNAL_KEY` = uma chave qualquer (para uso futuro)

**Alteracoes no codigo:**
- `supabase/functions/charger-commands/index.ts`: trocar `RAILWAY_OCPP_URL` por `OCPP_SERVER_URL` e `RAILWAY_INTERNAL_KEY` por `OCPP_INTERNAL_KEY`

