import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useWalletBalance = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: walletBalance, isLoading } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const { data, error } = await supabase
        .from("wallet_balances")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no wallet exists, create one
      if (!data) {
        const { data: newWallet, error: createError } = await supabase
          .from("wallet_balances")
          .insert([{ user_id: user.id, balance: 0 }])
          .select()
          .single();

        if (createError) throw createError;
        return newWallet;
      }

      return data;
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      const currentBalance = walletBalance?.balance || 0;
      const newBalance = Number(currentBalance) + amount;

      const { data, error } = await supabase
        .from("wallet_balances")
        .update({ balance: newBalance })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      toast({
        title: t("wallet.balanceAdded"),
        description: t("wallet.balanceAddedDescription"),
      });
    },
    onError: (error) => {
      console.error("Error adding balance:", error);
      toast({
        title: t("wallet.balanceError"),
        variant: "destructive",
      });
    },
  });

  const addTestBalance = () => {
    addBalanceMutation.mutate(25.00);
  };

  return {
    balance: walletBalance?.balance || 0,
    isLoading,
    addTestBalance,
    isAddingBalance: addBalanceMutation.isPending,
  };
};
