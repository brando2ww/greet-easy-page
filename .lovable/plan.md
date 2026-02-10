

## Fix: Accept "Preparing" as Valid OCPP Status for Starting Charge

### Problem
The charger 140414 has `ocpp_protocol_status: 'Preparing'` in the database. This is a valid OCPP status that means the cable is plugged in and the charger is ready. However, the code checks for exactly `'Available'` and rejects anything else as "offline".

After the first rejection, the auto-fix logic correctly reset the app-level `status` to `available`, but on the second attempt the `ocpp_protocol_status` is still `Preparing`, so it gets rejected again with "Estacao offline". Meanwhile, the first attempt's auto-fix changed status to `in_use` momentarily, causing a "station in use" error on retry.

### Solution
Accept multiple valid OCPP statuses that indicate the charger is connected and ready to charge. In OCPP 1.6, the valid statuses for starting a session are:
- **Available** - idle, ready
- **Preparing** - cable connected, awaiting authorization

### Technical Changes

**File 1: `src/hooks/useChargerValidation.tsx` (line 47)**

Change the strict equality check to accept both statuses:

```typescript
// Before
if (charger.ocppProtocolStatus !== 'Available') {

// After
const validOcppStatuses = ['Available', 'Preparing'];
if (!validOcppStatuses.includes(charger.ocppProtocolStatus || '')) {
```

**File 2: `supabase/functions/charger-commands/index.ts` (line ~103)**

Same fix on the backend validation:

```typescript
// Before
if (charger.ocpp_protocol_status !== 'Available') {

// After
const validOcppStatuses = ['Available', 'Preparing'];
if (!validOcppStatuses.includes(charger.ocpp_protocol_status || '')) {
```

These are the only two places where this check exists. Both need to be updated and the edge function redeployed.
