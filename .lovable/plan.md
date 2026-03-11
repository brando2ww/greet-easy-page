

## Aumentar Logo Texto 4x e Posicionar Atrás do Conteúdo

### Mudança

**Arquivo: `src/pages/AuthWelcome.tsx` — Linhas 37-43**

Tirar a imagem do fluxo normal, torná-la `absolute` e 4x maior (`h-40` em vez de `h-10`), posicionada atrás do subtitle e botões com `opacity` reduzida para efeito de fundo.

**Antes:**
```tsx
<div className="space-y-4 mb-16">
  <img src={speedTextLogo} alt="SpeedCharger" className="h-10 object-contain" />
  <p className="text-white/90 text-xl leading-relaxed font-light">
    {t('auth.welcome.subtitle')}
  </p>
</div>
```

**Depois:**
```tsx
<div className="relative space-y-4 mb-16">
  <img 
    src={speedTextLogo} 
    alt="SpeedCharger" 
    className="absolute -left-2 -top-4 h-40 object-contain opacity-20 pointer-events-none z-0" 
  />
  <p className="text-white/90 text-xl leading-relaxed font-light relative z-10">
    {t('auth.welcome.subtitle')}
  </p>
</div>
```

A imagem fica 4x maior (`h-40`), posicionada atrás (`z-0`, `opacity-20`) do texto (`z-10`), criando um efeito de marca d'água/fundo.

