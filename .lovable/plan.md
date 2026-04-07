

## Remover header e colocar logo inline na Home

### Mudança

**`src/pages/Home.tsx`**:
- Remover o `header` separado (linhas 26-30) e não passar `mobileHeader` ao `ResponsiveLayout`
- Mover o logo para dentro do conteúdo, acima do texto de saudação

```
<ResponsiveLayout showBottomNav>
  <div className="px-4 py-4 space-y-6 pb-32">
    {/* Logo */}
    <img src={speedLogo} alt="Nexcharge" className="h-10" />

    {/* Greeting */}
    <div>
      <h1>...</h1>
      ...
```

Um arquivo, remoção do `mobileHeader` prop e reposicionamento do logo.

