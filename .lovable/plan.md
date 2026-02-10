

## Fix: charger-commands Edge Function Authentication Failure

### Problem
The `charger-commands` edge function returns 401 "Authentication required" even when the user is logged in and the Authorization header with a valid JWT is sent. The `getUser()` call is silently failing, leaving `userId` as null.

### Root Cause
The edge function creates a Supabase client to validate the user but does not check or log errors from `getUser()`. This makes it impossible to diagnose why auth fails. Possible causes include the `esm.sh` import caching an old Supabase client version or `getUser()` returning an error object.

### Solution
1. Add error logging to the `getUser()` call so we can see why it fails
2. Use the token directly with `supabaseAdmin.auth.getUser(token)` instead of creating a second client -- this is simpler and more reliable
3. Parse the body before the auth check to avoid any request body consumption issues

### Technical Changes

**File:** `supabase/functions/charger-commands/index.ts`

Replace the auth block (lines 22-41) with a simpler approach:

```typescript
// Extract token from Authorization header
const authHeader = req.headers.get('Authorization');
let userId: string | null = null;

if (authHeader) {
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  
  if (authError) {
    console.error('[charger-commands] Auth error:', authError.message);
  }
  if (user) {
    userId = user.id;
  }
}

if (!userId) {
  return new Response(JSON.stringify({ error: 'Authentication required' }), {
    status: 401,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
```

Key change: Use `supabaseAdmin.auth.getUser(token)` (with the service role client) instead of creating a separate client with the anon key. This avoids potential issues with the second client setup and is the recommended approach for edge functions.

