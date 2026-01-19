import { useQuery } from "@tanstack/react-query";
import { transactionsApi } from "@/services/api";
import type { Transaction } from "@/types/charger";

export type ChargingSession = Transaction;

export const useChargingHistory = () => {
  return useQuery({
    queryKey: ["charging-history"],
    queryFn: async (): Promise<Transaction[]> => {
      const result = await transactionsApi.list();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result.data || [];
    },
  });
};
