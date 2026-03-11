import { supabase } from '@/integrations/supabase/client';
import type { 
  ChargePoint, 
  Transaction, 
  ChargerStatus, 
  RemoteCommandResponse,
  ApiResponse 
} from '@/types/charger';

// Helper function to call Edge Functions
async function invokeFunction<T>(
  functionName: string,
  body?: Record<string, unknown>
): Promise<ApiResponse<T>> {
  try {
    // Ensure the user's access token is sent to Edge Functions.
    // (In some environments it is not automatically attached.)
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers.Authorization = `Bearer ${session.access_token}`;
    }

    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body || {},
      headers,
    });

    if (error) {
      console.error(`[API] Error calling ${functionName}:`, error);
      return { error: error.message };
    }

    return { data: data as T };
  } catch (err) {
    console.error(`[API] Unexpected error calling ${functionName}:`, err);
    return { error: 'Unexpected error occurred' };
  }
}

// ============ Chargers API ============

export const chargersApi = {
  /**
   * List all chargers
   */
  list: async (): Promise<ApiResponse<ChargePoint[]>> => {
    return invokeFunction<ChargePoint[]>('chargers-api', { action: 'list' });
  },

  /**
   * Get a specific charger by ID
   */
  get: async (id: string): Promise<ApiResponse<ChargePoint>> => {
    return invokeFunction<ChargePoint>('chargers-api', { action: 'get', id });
  },

  /**
   * Get charger by OCPP Charge Point ID or UUID
   */
  getByCode: async (code: string): Promise<ApiResponse<ChargePoint>> => {
    return invokeFunction<ChargePoint>('chargers-api', { action: 'getByCode', code });
  },

  /**
   * Create a new charger (admin only)
   */
  create: async (data: Partial<ChargePoint>): Promise<ApiResponse<ChargePoint>> => {
    return invokeFunction<ChargePoint>('chargers-api', { action: 'create', ...data });
  },

  /**
   * Update a charger (admin only)
   */
  update: async (id: string, data: Partial<ChargePoint>): Promise<ApiResponse<ChargePoint>> => {
    return invokeFunction<ChargePoint>('chargers-api', { action: 'update', id, ...data });
  },

  /**
   * Delete a charger (admin only)
   */
  delete: async (id: string): Promise<ApiResponse<{ success: boolean }>> => {
    return invokeFunction<{ success: boolean }>('chargers-api', { action: 'delete', id });
  },
};

// ============ Charger Commands API ============

export const commandsApi = {
  /**
   * Start a charging session remotely
   */
  startCharge: async (
    chargerId: string, 
    idTag?: string
  ): Promise<ApiResponse<RemoteCommandResponse>> => {
    return invokeFunction<RemoteCommandResponse>('charger-commands', {
      action: 'start',
      chargerId,
      idTag,
    });
  },

  /**
   * Stop a charging session remotely
   */
  stopCharge: async (
    chargerId: string, 
    transactionId: number,
    sessionId?: string
  ): Promise<ApiResponse<RemoteCommandResponse>> => {
    return invokeFunction<RemoteCommandResponse>('charger-commands', {
      action: 'stop',
      chargerId,
      transactionId: transactionId || undefined,
      sessionId,
    });
  },

  /**
   * Get real-time status of a charger
   */
  getStatus: async (chargerId: string): Promise<ApiResponse<ChargerStatus>> => {
    return invokeFunction<ChargerStatus>('charger-commands', {
      action: 'status',
      chargerId,
    });
  },
};

// ============ Transactions API ============

export const transactionsApi = {
  /**
   * List transactions for the current user
   */
  list: async (): Promise<ApiResponse<Transaction[]>> => {
    return invokeFunction<Transaction[]>('transactions-api', { action: 'list' });
  },

  /**
   * Get a specific transaction by ID
   */
  get: async (id: string): Promise<ApiResponse<Transaction>> => {
    return invokeFunction<Transaction>('transactions-api', { action: 'get', id });
  },

  /**
   * List all transactions (admin only)
   */
  listAll: async (): Promise<ApiResponse<Transaction[]>> => {
    return invokeFunction<Transaction[]>('transactions-api', { action: 'listAll' });
  },

  /**
   * Get active session for current user
   */
  getActive: async (): Promise<ApiResponse<Transaction | null>> => {
    return invokeFunction<Transaction | null>('transactions-api', { action: 'getActive' });
  },

  /**
   * Get admin report with aggregated data
   */
  adminReport: async (): Promise<ApiResponse<any>> => {
    return invokeFunction('transactions-api', { action: 'adminReport' });
  },

  /**
   * Get admin wallet data (revenue, payment config)
   */
  adminWallet: async (): Promise<ApiResponse<any>> => {
    return invokeFunction('transactions-api', { action: 'adminWallet' });
  },

  /**
   * Save payment config (admin)
   */
  savePaymentConfig: async (data: { provider: string; account_email: string }): Promise<ApiResponse<any>> => {
    return invokeFunction('transactions-api', { action: 'savePaymentConfig', ...data });
  },

  /**
   * Delete payment config (admin)
   */
  deletePaymentConfig: async (provider: string): Promise<ApiResponse<any>> => {
    return invokeFunction('transactions-api', { action: 'deletePaymentConfig', provider });
  },

  /**
   * Get weekly energy stats for the current user
   */
  weeklyStats: async (): Promise<ApiResponse<{
    dailyData: { date: string; dayLabel: string; energy: number }[];
    currentPeriodTotal: number;
    previousPeriodTotal: number;
    changePercent: number;
  }>> => {
    return invokeFunction('transactions-api', { action: 'weeklyStats' });
  },
};
