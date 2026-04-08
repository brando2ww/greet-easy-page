

## Adicionar header com avatar e notificações na Home

### O que muda

**`src/pages/Home.tsx`**:
- Adicionar um header fixo no topo com:
  - **Avatar** do usuário (usando `Avatar`/`AvatarFallback` do shadcn, com iniciais do nome)
  - **Saudação**: "Hey! {nome}" + subtítulo "Ready to have a ride today?"
  - **Botão de notificação** (Bell icon com badge de contagem)
- Remover o logo atual que está no body (substituído pelo header)
- Passar esse header como `mobileHeader` prop do `ResponsiveLayout`

### Layout do header
```text
┌──────────────────────────────────┐
│ [Avatar] Hey! John        [🔔3] │
│          Ready to ride?          │
└──────────────────────────────────┘
```

### Detalhes técnicos
- Componentes `Avatar`, `AvatarFallback`, `AvatarImage` e `Badge` já existem em `src/components/ui/`
- Usar `Bell` do lucide-react para o ícone de notificação
- Usar `Button` variant `outline` size `icon` para o botão
- Avatar mostra foto do usuário (`user.user_metadata.avatar_url`) ou iniciais do nome
- Badge com contagem de notificações (inicialmente estático)
- Header passado via prop `mobileHeader` do `ResponsiveLayout` para ficar fixo no topo

