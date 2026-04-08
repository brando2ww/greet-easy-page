

## Trocar imagem do card "Iniciar Carga"

### Mudanças

**Copiar asset**: `user-uploads://image-20.png` → `src/assets/ev-car-icon.png`

**`src/pages/Home.tsx`**:
- Importar o novo asset `ev-car-icon.png`
- No card `startCharging`: remover a imagem de fundo (`evChargerBg` com `inset-0 object-cover opacity-20`) e substituir por `ev-car-icon.png` com o mesmo posicionamento do carregador no outro card (`absolute top-8 left-4 h-20 object-contain pointer-events-none`)
- Remover o import de `evChargerBg` se não for mais usado em nenhum lugar

### Resultado
O card "Iniciar Carga" terá o carro elétrico posicionado no canto superior esquerdo, igual ao carregador no card "Estações", sem imagem de fundo transparente.

