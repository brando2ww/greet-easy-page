

## Alinhar imagem do texto logo à esquerda, abaixo do logo

### Mudança

**Arquivo: `src/pages/AuthWelcome.tsx` — Linhas 38-46**

O problema é que a imagem `h-40` com `object-contain` fica centralizada por padrão e o `-mt-32` no texto cria sobreposição desorganizada. A solução é:

1. Alinhar a imagem à esquerda com `object-left`
2. Remover o `space-y-4` que adiciona espaço desnecessário
3. Manter o `-mt-32` no subtitle para sobrepor corretamente

```tsx
<div className="mb-16">
  <img 
    src={speedTextLogo} 
    alt="SpeedCharger" 
    className="h-40 object-contain object-left pointer-events-none" 
  />
  <p className="text-white/90 text-xl leading-relaxed font-light -mt-32">
    {t('auth.welcome.subtitle')}
  </p>
</div>
```

A imagem fica alinhada à esquerda, diretamente abaixo do logo quadrado, criando um layout organizado e coerente.

