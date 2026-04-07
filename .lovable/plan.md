

## Corrigir erro: constraint do banco não aceita `awaiting_plug`

### Problema

O erro nos logs é claro:
```
new row for relation "charging_sessions" violates check constraint "charging_sessions_status_check"
```

A constraint atual permite apenas: `in_progress`, `completed`, `cancelled`. O status `awaiting_plug` não existe no banco.

Além disso, a coluna `started_at` é `NOT NULL` com default `now()`, então inserir com `started_at: null` também falha.

### Solução

Criar uma migration que:
1. Atualiza o check constraint para incluir `awaiting_plug`
2. Torna `started_at` nullable

### Mudanças

| Arquivo | O que muda |
|---------|-----------|
| `supabase/migrations/XXXX_add_awaiting_plug_status.sql` | Nova migration: drop + recreate check constraint com `awaiting_plug`; alter `started_at` para nullable |

### SQL da migration

```sql
-- Add awaiting_plug to allowed statuses
ALTER TABLE charging_sessions DROP CONSTRAINT charging_sessions_status_check;
ALTER TABLE charging_sessions ADD CONSTRAINT charging_sessions_status_check
  CHECK (status = ANY (ARRAY['in_progress', 'completed', 'cancelled', 'awaiting_plug']));

-- Allow started_at to be null (for awaiting_plug sessions)
ALTER TABLE charging_sessions ALTER COLUMN started_at DROP NOT NULL;
```

Nenhuma mudança no código da Edge Function ou frontend -- o problema é exclusivamente no esquema do banco de dados.

