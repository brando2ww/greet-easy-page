

## Criar Templates de Email de Autenticação — Nexcharge

### O que será feito

1. **Scaffold dos templates** via `scaffold_auth_email_templates` — cria os 6 templates + edge function `auth-email-hook`
2. **Aplicar branding Nexcharge** em todos os templates:
   - Cor primária (botões): `hsl(142, 71%, 45%)` (verde)
   - Cor do texto: `hsl(240, 10%, 15%)`
   - Texto muted: `hsl(240, 5%, 45%)`
   - Border radius: `0.75rem`
   - Background do body: `#ffffff`
   - Logo: upload do `nexcharge-logo.png` para bucket `email-assets`
   - Idioma: Português
3. **Deploy** da edge function `auth-email-hook`
4. **Previews** dos templates para validação visual

### Arquivos criados/modificados

| Ação | Arquivo |
|------|---------|
| Criar (scaffold) | `supabase/functions/auth-email-hook/index.ts` |
| Criar (scaffold) | `supabase/functions/auth-email-hook/deno.json` |
| Criar (scaffold) | `supabase/functions/_shared/email-templates/signup.tsx` |
| Criar (scaffold) | `supabase/functions/_shared/email-templates/recovery.tsx` |
| Criar (scaffold) | `supabase/functions/_shared/email-templates/magic-link.tsx` |
| Criar (scaffold) | `supabase/functions/_shared/email-templates/invite.tsx` |
| Criar (scaffold) | `supabase/functions/_shared/email-templates/email-change.tsx` |
| Criar (scaffold) | `supabase/functions/_shared/email-templates/reauthentication.tsx` |
| Criar | Bucket `email-assets` + upload logo |
| Deploy | Edge function `auth-email-hook` |

### Fluxo de execução

1. Chamar `scaffold_auth_email_templates`
2. Upload do logo para storage bucket `email-assets`
3. Ler cada template gerado e aplicar branding (cores, logo, textos em português)
4. Deploy da edge function
5. Mostrar previews dos templates

### Nota sobre DNS

Os registros TXT já estão configurados no registro.br. A verificação do DNS acontece automaticamente. Os emails customizados serão ativados assim que a verificação concluir. Enquanto isso, os emails padrão do Supabase continuam funcionando.

