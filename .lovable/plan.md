
## Correção do erro 403 no painel admin

O erro continua porque o proxy do projeto **NEXCHARGE ADMIN** ainda está chamando a função `chargers-api` com os headers errados.

Hoje ele envia:

```ts
Authorization: Bearer ${railwayKey}
apikey: railwayKey
```

Mas a função `chargers-api` do Nexcharge espera a chave interna neste header:

```ts
x-internal-key: <RAILWAY_INTERNAL_KEY>
```

Por isso o log do Nexcharge continua mostrando:

```text
Action: create, User: null, Admin: false
```

Ou seja: a requisição chega, mas não é reconhecida como admin interno.

## Plano de correção

### 1. Corrigir o proxy no projeto NEXCHARGE ADMIN

No arquivo:

```text
supabase/functions/chargers-proxy/index.ts
```

Trocar o `fetch` para enviar a chave assim:

```ts
const railwayKey = Deno.env.get('RAILWAY_INTERNAL_KEY');
const nexchargeAnonKey = Deno.env.get('NEXCHARGE_ANON_KEY');

if (!railwayKey) {
  return new Response(JSON.stringify({ error: 'RAILWAY_INTERNAL_KEY not configured' }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

if (!nexchargeAnonKey) {
  return new Response(JSON.stringify({ error: 'NEXCHARGE_ANON_KEY not configured' }), {
    status: 500,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const externalRes = await fetch(EXTERNAL_URL, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'apikey': nexchargeAnonKey,
    'x-internal-key': railwayKey,
  },
  body: JSON.stringify(body),
});
```

### 2. Adicionar o secret `NEXCHARGE_ANON_KEY` no projeto admin

No projeto **NEXCHARGE ADMIN**, configurar:

```text
NEXCHARGE_ANON_KEY=<anon key do projeto Nexcharge fgvjvtglcmxzadetmmoi>
```

Esse valor é público/anon e pode ser o mesmo que já aparece no código do admin em `src/lib/nexchargeApi.ts`.

### 3. Manter o mesmo `RAILWAY_INTERNAL_KEY` nos dois projetos

Confirmar que:

```text
Nexcharge atual:
RAILWAY_INTERNAL_KEY = nova chave gerada

NEXCHARGE ADMIN:
RAILWAY_INTERNAL_KEY = exatamente a mesma chave
```

### 4. Melhorar o log de diagnóstico temporário

Adicionar um log seguro no proxy, sem imprimir a chave inteira:

```ts
console.log('[chargers-proxy] internal key present:', Boolean(railwayKey), 'length:', railwayKey?.length);
```

Assim conseguimos confirmar se o runtime do Supabase está lendo o secret corretamente.

### 5. Ajuste opcional no Nexcharge atual

No `chargers-api`, atualizar CORS para incluir `x-internal-key`:

```ts
'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-internal-key',
```

Isso melhora compatibilidade para testes diretos e evita problemas se algum cliente chamar a função via browser.

### 6. Deploy e teste

Depois das alterações:

1. Deploy da função `chargers-proxy` no projeto **NEXCHARGE ADMIN**
2. Se alterarmos CORS, deploy da função `chargers-api` neste projeto
3. Testar criar carregador novamente
4. Conferir se o log do Nexcharge passa a mostrar:

```text
[chargers-api] Authenticated via internal API key
[chargers-api] Action: create, User: internal-admin, Admin: true
```

## Resultado esperado

O botão **Criar Carregador** no painel admin deve parar de retornar:

```text
Edge Function returned a non-2xx status code
Admin access required
```

e a criação deve funcionar normalmente.

<lov-actions>
<lov-link url="https://docs.lovable.dev/tips-tricks/troubleshooting">Troubleshooting docs</lov-link>
</lov-actions>
