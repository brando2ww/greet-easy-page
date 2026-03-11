

## Aumentar limite de upload de avatar para 5MB

### Mudança

**`src/pages/Perfil.tsx`** — Alterar o limite de 2MB para 5MB na função `handleAvatarUpload` (linha ~101): trocar `2 * 1024 * 1024` por `5 * 1024 * 1024` e atualizar a mensagem de erro.

