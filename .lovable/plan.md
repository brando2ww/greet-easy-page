

## Implementar Recuperação de Senha

### O que será feito

1. **Página "Esqueceu a senha"** (`/auth/forgot-password`) — formulário com campo de email que chama `supabase.auth.resetPasswordForEmail()` com redirect para `/auth/reset-password`

2. **Página "Redefinir senha"** (`/auth/reset-password`) — formulário com nova senha + confirmação, detecta `type=recovery` na URL e chama `supabase.auth.updateUser({ password })`

3. **Atualizar link "Esqueceu a senha?"** no Login — apontar para `/auth/forgot-password` em vez de `href="#"`

4. **Rotas no App.tsx** — adicionar as duas rotas públicas

5. **Traduções** — adicionar chaves nos 4 arquivos de locale (pt, en, es, zh)

### Detalhes técnicos

- Ambas as páginas seguem o mesmo visual do Login (fundo escuro com imagem, logo, campos com ícones)
- A página de reset precisa verificar o hash da URL para `type=recovery` no `onAuthStateChange`
- `redirectTo` será `${window.location.origin}/auth/reset-password`

### Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/pages/ForgotPassword.tsx` |
| Criar | `src/pages/ResetPassword.tsx` |
| Editar | `src/pages/Login.tsx` (link esqueceu senha) |
| Editar | `src/App.tsx` (2 rotas) |
| Editar | `src/locales/pt.json`, `en.json`, `es.json`, `zh.json` |

