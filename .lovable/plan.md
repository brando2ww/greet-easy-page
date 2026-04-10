

## Problema

A Edge Function `chargers-api` valida o JWT usando `supabaseUser.auth.getUser()` que só reconhece usuários do projeto **local** (`fgvjvtglcmxzadetmmoi`). Quando o sistema externo (`nfhzdeccebjmctjzgwis`) envia um JWT, o `getUser()` falha ou retorna um user que não existe na tabela `user_roles` local, resultando em 403.

## Solução

Adicionar um mecanismo de **API Key interna** para autenticação cross-project. O sistema externo enviará um header `x-internal-key` com um secret compartilhado (`RAILWAY_INTERNAL_KEY`, já configurado). Quando presente e válido, a função concede acesso admin sem verificar JWT/user_roles.

## Mudança

**`supabase/functions/chargers-api/index.ts`** (linhas ~100-125):

Antes da verificação de JWT, adicionar:

```typescript
// Check for internal API key (cross-project auth)
const internalKey = req.headers.get('x-internal-key');
const expectedKey = Deno.env.get('RAILWAY_INTERNAL_KEY');

if (internalKey && expectedKey && internalKey === expectedKey) {
  isAdmin = true;
  userId = 'internal-admin';
  console.log('[chargers-api] Authenticated via internal API key');
}
```

Se `isAdmin` já for `true` (via internal key), pular a verificação de JWT. Caso contrário, manter o fluxo atual.

## Arquivo editado
- `supabase/functions/chargers-api/index.ts`

## Como o sistema externo deve chamar

```typescript
// No outro projeto, ao chamar chargers-api:
const response = await fetch(
  'https://fgvjvtglcmxzadetmmoi.supabase.co/functions/v1/chargers-api',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': '<ANON_KEY>',
      'x-internal-key': '<RAILWAY_INTERNAL_KEY>'
    },
    body: JSON.stringify({ action: 'create', name: '...', ... })
  }
);
```

O secret `RAILWAY_INTERNAL_KEY` já existe nas secrets do Supabase. O sistema externo precisa apenas configurar o mesmo valor.

