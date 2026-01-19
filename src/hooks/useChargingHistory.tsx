import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/services/api";
import type { Transaction } from "@/types/charger";
import { useAuth } from "@/contexts/AuthContext";

export type ChargingSession = Transaction;

export const useChargingHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["charging-history", user?.id],
    queryFn: async (): Promise<Transaction[]> => {
      const result = await transactionsApi.list();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || [];
    },
    enabled: !!user, // Only run query when user is authenticated
  });
};
