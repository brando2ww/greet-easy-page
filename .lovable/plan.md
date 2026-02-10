

## Add Confirmation Dialog Before Stopping Charging Session

### Overview
Add an AlertDialog that appears when the user taps "Parar Carregamento", requiring them to confirm before the stop command is sent. This prevents accidental session stops.

### Technical Change

**File: `src/pages/Carregamento.tsx`**

1. Import `AlertDialog` components from `@/components/ui/alert-dialog`
2. Add a `showStopConfirm` state (boolean, default `false`)
3. Change the "Parar Carregamento" button's `onClick` to set `showStopConfirm = true` instead of calling `handleStop` directly
4. Add an `AlertDialog` controlled by `showStopConfirm`:
   - Title: "Parar Carregamento?"
   - Description: "Tem certeza que deseja encerrar esta sessao de carregamento? Esta acao nao pode ser desfeita."
   - Cancel button: "Cancelar" (closes dialog)
   - Confirm button: "Sim, Parar" (calls `handleStop`, closes dialog)

No other files need changes -- the AlertDialog component already exists in the project.
