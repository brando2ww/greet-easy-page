

## Atualizar Edge Function charger-commands para o novo servidor OCPP

### Passo 1: Adicionar Secrets

Vou solicitar a adicao de dois secrets no Supabase:

- **OCPP_SERVER_URL** = `http://68.183.152.189:80`
- **OCPP_INTERNAL_KEY** = uma chave segura para uso futuro

### Passo 2: Atualizar o codigo da Edge Function

No arquivo `supabase/functions/charger-commands/index.ts`, as seguintes mudancas serao feitas:

1. Trocar `RAILWAY_OCPP_URL` por `OCPP_SERVER_URL`
2. Trocar `RAILWAY_INTERNAL_KEY` por `OCPP_INTERNAL_KEY`
3. Manter os endpoints `/api/remote-start` e `/api/remote-stop` (sao os mesmos no novo servidor)
4. Manter o header `x-internal-key` para seguranca futura

### Detalhes tecnicos

**Linha 12** - Variavel de ambiente:
```
// De:
const RAILWAY_OCPP_URL = Deno.env.get('RAILWAY_OCPP_URL');
// Para:
const OCPP_SERVER_URL = Deno.env.get('OCPP_SERVER_URL');
```

**Todas as referencias** a `RAILWAY_OCPP_URL` no codigo serao substituidas por `OCPP_SERVER_URL`, e `RAILWAY_INTERNAL_KEY` por `OCPP_INTERNAL_KEY`.

Isso inclui:
- Condicional de verificacao (`if (RAILWAY_OCPP_URL && ...)` → `if (OCPP_SERVER_URL && ...)`)
- URLs de fetch (`${RAILWAY_OCPP_URL}/api/remote-start` → `${OCPP_SERVER_URL}/api/remote-start`)
- Headers de autenticacao (`Deno.env.get('RAILWAY_INTERNAL_KEY')` → `Deno.env.get('OCPP_INTERNAL_KEY')`)

### Resultado

A Edge Function vai passar a enviar comandos de RemoteStart/RemoteStop para o servidor OCPP no Droplet Digital Ocean (`http://68.183.152.189:80`) em vez da URL antiga.

