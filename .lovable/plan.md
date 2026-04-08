

## Fundo branco na página de Carregamento

### Mudança
**`src/pages/Carregamento.tsx`**: Trocar `bg-gray-950 text-white` para `bg-white text-gray-900` no container principal, e ajustar as cores internas (cards, textos, bordas, dialog) para funcionar com fundo claro.

### Detalhes
- Container: `bg-white text-gray-900`
- Cards de stats: `bg-gray-100` ao invés de `bg-white/5`
- Textos secundários: `text-gray-500` ao invés de `text-gray-400`
- SVG ring background: `rgba(0,0,0,0.06)` ao invés de `rgba(255,255,255,0.06)`
- Battery segments vazios: `bg-gray-200` ao invés de `bg-white/10`
- Offline banner: ajustar opacidades
- AlertDialog: `bg-white border-gray-200 text-gray-900`
- Botão voltar hover: `hover:bg-gray-100`

### Arquivo editado
- `src/pages/Carregamento.tsx`

