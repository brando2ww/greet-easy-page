

## Substituir logo na página Estações

### Mudanças

1. **Copiar o novo logo** para `src/assets/nexcharge-logo.png`

2. **`src/pages/Estacoes.tsx`** — Trocar o import do logo antigo (`speed_logo_04-2.png`) pelo novo e ajustar o `img`:
   - Linha 8: `import speedLogo from "@/assets/nexcharge-logo.png";`
   - O elemento na linha 77 já usa `speedLogo`, então renderizará o novo logo automaticamente.

