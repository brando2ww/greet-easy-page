

## Restaurar Fundo Branco no Logo (Estilo App Icon)

### Mudança

**Arquivo: `src/pages/AuthWelcome.tsx` — Linha 31-33**

Restaurar o container branco com bordas arredondadas ao redor do logo:

**Antes:**
```tsx
<div className="w-16 h-16 flex items-center justify-center">
  <img src={newLogo} alt="Speed Logo" className="w-full h-full object-contain" />
</div>
```

**Depois:**
```tsx
<div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center p-2 shadow-lg">
  <img src={newLogo} alt="Speed Logo" className="w-full h-full object-contain" />
</div>
```

Adiciona `bg-white`, `rounded-2xl`, `p-2` e `shadow-lg` para o efeito de ícone de app.

