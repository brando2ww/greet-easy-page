

## Substituir BottomNavigation por novo menu animado com framer-motion

### Visao geral

Criar um novo `BottomNavigation` inspirado no componente `MenuBar` fornecido e na imagem de referencia. O menu tera fundo escuro arredondado (pill shape), icones claros, e o item ativo destacado com circulo verde (primary). Usara framer-motion para animacoes suaves.

### Design (baseado na imagem)

- Barra flutuante com fundo escuro (`bg-foreground`), bordas arredondadas (`rounded-full`)
- 5 itens: Home, Estacoes, Iniciar Carga, Carteira, Perfil
- Item ativo: circulo verde (`bg-primary`) com icone branco
- Itens inativos: icones em cor clara/muted
- Sem labels vissiveis (icones apenas, como na imagem)
- Padding inferior seguro para safe area

### Mudancas

1. **Instalar `framer-motion`** via npm

2. **Reescrever `src/components/BottomNavigation.tsx`**:
   - Fundo escuro pill-shaped fixo na parte inferior
   - 5 icones Lucide: `House`, `MapPin`, `Zap`, `Wallet`, `User`
   - Item ativo recebe circulo animado verde (motion.div com layoutId para transicao suave entre itens)
   - Icone ativo fica branco, inativos ficam muted
   - Sem texto/labels (apenas icones como na imagem)
   - Usar `useLocation` + `Link` do react-router-dom

3. **Adicionar CSS de tooltip** ao `src/index.css` (as animacoes do componente fornecido) - minimo necessario

4. **Nao sera criado** o arquivo `bottom-menu.tsx` separado - o codigo sera adaptado diretamente no `BottomNavigation.tsx` existente, mantendo a mesma interface de uso

### Arquivos modificados

| Arquivo | Acao |
|---|---|
| `src/components/BottomNavigation.tsx` | Reescrever com novo design |
| `src/index.css` | Adicionar keyframes de animacao |
| `package.json` | Adicionar framer-motion |

### Nao afetados

- `AdminNavigation.tsx` - permanece como esta
- `ResponsiveLayout.tsx` - ja importa `BottomNavigation`, nenhuma mudanca necessaria
- `IniciarCarga.tsx` e `Carregamento.tsx` - ja usam `BottomNavigation`, continuam funcionando

