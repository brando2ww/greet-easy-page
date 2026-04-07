

## Trocar ícone de "Minha Localização" para LocateFixed

### Mudança

No `src/components/map/StationsMap.tsx`:
- Trocar o import de `Navigation` por `LocateFixed` do `lucide-react`
- Substituir `<Navigation className="h-5 w-5" />` por `<LocateFixed className="h-5 w-5" />`

Uma única linha de import e uma linha no JSX.

