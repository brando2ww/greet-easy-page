

## Manter imagem no lugar original, apenas com z-index atrás

O problema é que o `absolute` está mudando o posicionamento e afetando o layout. A solução é manter a imagem no fluxo normal (sem `absolute`), apenas usando `z-index` negativo e `position: relative` para ficar atrás do texto sem interferir nas margens.

### Mudança

**Arquivo: `src/pages/AuthWelcome.tsx` — Linhas 38-47**

**Depois:**
```tsx
<div className="space-y-4 mb-16">
  <img 
    src={speedTextLogo} 
    alt="SpeedCharger" 
    className="h-40 object-contain opacity-20 pointer-events-none" 
  />
  <p className="text-white/90 text-xl leading-relaxed font-light -mt-32">
    {t('auth.welcome.subtitle')}
  </p>
</div>
```

A imagem fica no fluxo normal (sem `absolute`), mantém `h-40` e `opacity-20`. O texto usa `margin-top` negativo (`-mt-32`) para sobrepor a imagem, ficando na frente naturalmente. Sem mexer em margens externas.

