

## Trocar todas as cores verdes por #bfd13b

A cor `#bfd13b` converte para HSL: **67 65% 53%**.

### 1. CSS Variables (`src/index.css`)

Atualizar as variáveis do design system:

| Variável | Valor atual | Novo valor |
|---|---|---|
| `--primary` (light) | `142 71% 45%` | `67 65% 53%` |
| `--primary-glow` (light) | `142 71% 60%` | `67 65% 65%` |
| `--ring` (light) | `142 71% 45%` | `67 65% 53%` |
| `--gradient-hero` (light) | `hsl(142 71% 45%), hsl(160 84% 39%)` | `hsl(67 65% 53%), hsl(75 60% 45%)` |
| `--shadow-elegant` (light) | `hsl(142 71% 45% / 0.3)` | `hsl(67 65% 53% / 0.3)` |
| `--primary` (dark) | `142 71% 50%` | `67 65% 58%` |
| `--primary-glow` (dark) | `142 71% 65%` | `67 65% 70%` |
| `--ring` (dark) | `142 71% 50%` | `67 65% 58%` |
| `--gradient-hero` (dark) | similar | similar com novos tons |
| `--shadow-elegant` (dark) | similar | similar com novos tons |

### 2. Hardcoded Tailwind greens (24 arquivos)

Substituir todas as classes Tailwind `green-*` por equivalentes usando a cor primary do sistema ou a cor customizada. Principais arquivos:

- **AdminNavigation.tsx**: `from-green-300 to-lime-400`, `text-green-600`, `shadow-green-400/50` → usar classes `bg-primary`, `text-primary`
- **ChargerCard.tsx**: `from-green-300 to-lime-400`, `text-green-500`, `bg-green-500/10 text-green-600` → `bg-primary`, `text-primary`
- **ChargerDetailsDrawer.tsx**: `bg-green-500`, `bg-green-100`, `text-green-600` → `bg-primary`, `bg-primary/10`, `text-primary`
- **Estacoes.tsx**: `bg-green-500`, `hover:bg-green-600` → `bg-primary`, `hover:bg-primary/90`
- **Veiculos.tsx**: `border-green-600`, `ring-green-600` → `border-primary`, `ring-primary`
- **Perfil.tsx**: `text-green-600` → `text-primary`
- **Home.tsx**: referências green → `text-primary`, `bg-primary`
- **Carteira/CarteiraSucesso/Carregamento**: green refs → primary
- **ChargingHistorySheet.tsx**: `bg-green-500/10 text-green-600` → `bg-primary/10 text-primary`
- **NavigationAppSelector.tsx**: `bg-green-50` → `bg-primary/5`
- **StationsMap.tsx**: cores do marcador
- **ChargerMiniChart.tsx**: `#86efac`, `#22c55e` → `#bfd13b`
- **ForgotPassword.tsx**: `text-green-400` → `text-primary`
- **Dicas.tsx**: `bg-green-500` → `bg-primary`
- **Auth.tsx, Login.tsx, SignUp.tsx**: refs green → primary
- **AdminSidebar.tsx, Dashboard.tsx, Relatorios.tsx**: refs green → primary

### 3. Tailwind config (`tailwind.config.ts`)

Nenhuma mudança necessaria — as cores ja vem das CSS variables.

### Resultado

Toda a interface passara a usar `#bfd13b` (verde-limao) como cor primaria, tanto via CSS variables quanto nas classes hardcoded.

