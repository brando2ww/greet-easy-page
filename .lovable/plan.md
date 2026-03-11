

## Substituir Logo na Página de Boas-vindas

### Contexto
O usuário enviou uma nova imagem de logo e selecionou o elemento de imagem atual na tela AuthWelcome. O logo atual (`speed_logo_04-2.png`) está dentro de um container branco com bordas arredondadas.

### Mudanças Propostas

1. **Copiar nova imagem**: `user-uploads://Design_sem_nome_8.png` → `src/assets/logo-speed.png`

2. **Atualizar AuthWelcome.tsx**:
   - Trocar import de `speedLogo` para o novo logo
   - Remover o fundo branco do container do logo (já que o novo logo tem fundo transparente e cores próprias)
   - Aumentar levemente o tamanho (16x16 ao invés de 12x12)

**Antes:**
```tsx
import speedLogo from "@/assets/speed_logo_04-2.png";
// ...
<div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1">
  <img src={speedLogo} alt="Speed Logo" className="w-full h-full object-contain" />
</div>
```

**Depois:**
```tsx
import newLogo from "@/assets/logo-speed.png";
// ...
<div className="w-16 h-16 flex items-center justify-center">
  <img src={newLogo} alt="Speed Logo" className="w-full h-full object-contain" />
</div>
```

