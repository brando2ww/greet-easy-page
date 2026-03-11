

## Corrigir upload de foto de perfil

**Problema:** A foto está sendo convertida para base64 e enviada diretamente no `user_metadata`, o que gera um payload enorme e causa timeout 504.

**Solução:** Fazer upload da imagem para o Supabase Storage (bucket `avatars`) e salvar apenas a URL pública no metadata.

### Mudanças

1. **Supabase Storage** — Criar bucket `avatars` (público) via migration SQL
2. **`src/pages/Perfil.tsx`** — Refatorar `handleSaveProfile`:
   - Fazer upload do arquivo para `storage.from('avatars').upload(...)` usando o `user.id` como path
   - Obter a URL pública com `getPublicUrl()`
   - Salvar apenas a URL no `user_metadata.avatar_url`
   - Manter o base64 apenas para preview local antes de salvar

### Detalhes técnicos

- Migration SQL:
  ```sql
  INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
  CREATE POLICY "Users can upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
  CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT TO public USING (bucket_id = 'avatars');
  ```

- No `handleSaveProfile`, guardar o `File` object original (não só o base64) para fazer o upload via Storage API
- Limitar tamanho do arquivo a 2MB no frontend

