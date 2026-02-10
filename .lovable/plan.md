

## Fix: Redeploy transactions-api Edge Function

### Problem
The `weeklyStats` action returns `{"error":"Invalid action"}` (400 status). The code in `transactions-api/index.ts` already includes the `weeklyStats` case (line 203), but the **deployed** version on Supabase is outdated and doesn't recognize the action.

### Solution
Simply redeploy the `transactions-api` edge function. No code changes are needed - the function code is already correct.

### Steps
1. Redeploy the `transactions-api` edge function
2. Verify the `weeklyStats` action returns data correctly

