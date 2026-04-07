
## Corrigir o “deu erro de novo”: o backend já responde, mas o app esconde a mensagem real

### O que realmente está acontecendo
O erro exibido no app não mostra mais a causa real. O `charger-commands` está retornando um status não-2xx com JSON, mas o wrapper em `src/services/api.ts` descarta o corpo da resposta e devolve apenas a mensagem genérica do Supabase:

```ts
"Edge Function returned a non-2xx status code"
```

Por isso, mesmo quando o backend responde algo específico como “carregador offline”, “saldo insuficiente” ou “authentication required”, o usuário só vê o erro genérico.

Além disso, o frontend ainda não faz a checagem de heartbeat usando `charger.lastHeartbeat` antes de tentar iniciar, então ele continua chamando a função mesmo quando o carregador está desconectado.

### Arquivos a ajustar
- `src/services/api.ts`
- `src/hooks/useChargerValidation.tsx`

### Plano de implementação

1. **Corrigir o parser de erro da Edge Function**
   - Em `invokeFunction`, detectar `FunctionsHttpError`
   - Ler `error.context.json()` e extrair `message` ou `error`
   - Fazer fallback para `error.context.text()` ou `error.message` se o body não vier em JSON
   - Assim o app passa a receber a mensagem real da função

2. **Melhorar a validação antes de iniciar sessão**
   - Em `useChargerValidation.tsx`, usar `charger.lastHeartbeat`
   - Considerar conectado apenas se o heartbeat tiver menos de 2 minutos
   - Se estiver vencido, bloquear o início no próprio frontend e mostrar toast amigável
   - Isso evita chamada desnecessária ao `charger-commands`

3. **Preservar os tratamentos específicos já existentes**
   - Manter os toasts para:
     - saldo insuficiente
     - autenticação
     - carregador offline
     - falha no remote start
   - Com o parser corrigido, esses caminhos finalmente passam a funcionar

4. **Padronizar a mensagem final exibida ao usuário**
   - Se a função retornar `message`, usar essa
   - Se retornar só `error`, usar `error`
   - Só cair no texto genérico em último caso

### Resultado esperado
Ao tentar iniciar com carregador offline, o usuário verá algo como:
- “Carregador offline”
- “O carregador não está respondendo. Verifique a conexão e tente novamente.”

Em vez de:
- “Edge Function returned a non-2xx status code”

### Detalhes técnicos
```text
Hoje:
frontend -> functions.invoke()
        -> recebe 400/500 da Edge Function
        -> wrapper retorna só error.message genérica
        -> toast mostra erro genérico

Depois:
frontend -> functions.invoke()
        -> recebe 400/500 da Edge Function
        -> wrapper lê error.context.json()
        -> extrai message/error real
        -> toast mostra causa correta
```

### Observação importante
Pelos logs atuais, eu não vejo evidência de um novo crash interno da função. O sintoma principal agora é de **tratamento incorreto do erro no cliente**, não necessariamente de falha nova no backend.
