import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface WalletTransaction {
  id: string;
  user_id: string;
  type: "deposit" | "withdrawal" | "charge";
  status: "pending" | "completed" | "failed" | "cancelled";
  amount: number;
  description: string | null;
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
}

export const useWalletTransactions = () => {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["wallet-transactions"],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      if (session?.access_token) {
        headers.Authorization = `Bearer ${session.access_token}`;
      }

      const { data, error } = await supabase.functions.invoke("wallet-api", {
        body: { action: "list-transactions" },
        headers,
      });

      if (error) throw error;
      return (data?.transactions || []) as WalletTransaction[];
    },
  });

  return {
    transactions: data || [],
    isLoading,
    refetch,
  };
};
