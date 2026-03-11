

## Substituir Texto "SpeedCharger —" por Imagem

### Mudança

1. Copiar `user-uploads://Design_sem_nome_9.png` para `src/assets/speed-text-logo.png`

2. **Arquivo: `src/pages/AuthWelcome.tsx` — Linha 38**

Substituir o `<h1>` com texto por uma imagem:

**Antes:**
```tsx
<h1 className="text-white text-4xl font-bold leading-tight tracking-tight">
  {t('auth.welcome.title')}
</h1>
```

**Depois:**
```tsx
<img src={speedTextLogo} alt="SpeedCharger" className="h-10 object-contain" />
```

Adicionar import no topo:
```tsx
import speedTextLogo from "@/assets/speed-text-logo.png";
```

A imagem branca ficará visível sobre o fundo escuro, substituindo o texto.

