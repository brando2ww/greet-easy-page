

## Traduzir Status do Carregador no Drawer do Mapa

### Problema
Na linha 175, o status do carregador e exibido diretamente em ingles (`available`, `in_use`, `maintenance`, `offline`) usando `charger.status.replace('_', ' ')`.

### Solucao
Criar um mapeamento de status para portugues e usar no lugar do valor cru.

### Mudanca Tecnica

**Arquivo: `src/components/map/ChargerDetailsDrawer.tsx`**

Adicionar um objeto de mapeamento antes do return:

```typescript
const statusLabels: Record<string, string> = {
  available: 'Disponível',
  in_use: 'Em Uso',
  maintenance: 'Manutenção',
  offline: 'Offline',
};
```

Substituir a linha 175:
- **Antes:** `{charger.status.replace('_', ' ')}`
- **Depois:** `{statusLabels[charger.status] || charger.status.replace('_', ' ')}`

