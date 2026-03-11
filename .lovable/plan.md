

## Substituir Logo na Página de Login

### Mudança

**Arquivo: `src/pages/Login.tsx`**

Trocar o import do logo antigo (`speed_logo_04-2.png`) pelo novo (`logo-speed.png`), igual ao usado no AuthWelcome.

**Antes (linha 11):**
```tsx
import speedLogo from "@/assets/speed_logo_04-2.png";
```

**Depois:**
```tsx
import speedLogo from "@/assets/logo-speed.png";
```

O container já tem `bg-white rounded-3xl p-3`, então o estilo app icon será mantido automaticamente.

