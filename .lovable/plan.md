

## Fix: "Stop Charging" Fails When transactionId is Null

### Problem
When tapping "Stop Charging", the edge function returns `400: chargerId and transactionId are required`. This happens because:
1. The charging session may not have received a `transactionId` from the OCPP server yet
2. The frontend sends `session.transactionId ?? 0`, and `0` is falsy
3. The edge function check `!transactionId` rejects it

### Solution
Update both the edge function and frontend to support stopping by **session ID** as a fallback when `transactionId` is not available.

### Technical Changes

**1. Edge Function: `supabase/functions/charger-commands/index.ts`**

Update the `stop` case (lines 196-202) to accept either `transactionId` OR `sessionId`:

```typescript
case 'stop': {
  if (!chargerId) {
    return new Response(JSON.stringify({ error: 'chargerId is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // ... get charger details (unchanged) ...

  // Send OCPP remote stop only if we have a transactionId
  if (OCPP_SERVER_URL && charger.ocpp_charge_point_id && transactionId) {
    // ... existing OCPP remote stop logic (unchanged) ...
  }

  // Update session status - find by transactionId or sessionId
  const sessionFilter = transactionId
    ? supabaseAdmin.from('charging_sessions').update({ ... }).eq('transaction_id', transactionId)
    : supabaseAdmin.from('charging_sessions').update({ ... }).eq('id', body.sessionId).eq('user_id', userId);

  // ... rest unchanged ...
}
```

**2. Frontend: `src/pages/Carregamento.tsx`**

Update `handleStop` to also send `sessionId`:

```typescript
const res = await commandsApi.stopCharge(session.chargerId, session.transactionId ?? 0);
```
Change to pass sessionId via the API.

**3. Service Layer: `src/services/api.ts`**

Update `commandsApi.stopCharge` to also accept an optional `sessionId` parameter.

### Data Flow
1. User taps "Stop Charging"
2. Frontend sends `{ action: 'stop', chargerId, transactionId (if available), sessionId }`
3. Edge function uses `transactionId` for OCPP remote stop if available
4. Edge function finds session by `transactionId` or falls back to `sessionId` for DB update
5. Session marked as completed

