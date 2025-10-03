import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useWalletBalance = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: balance = 0, isLoading, error } = useQuery({
    queryKey: ["wallet-balance"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("wallet_balances")
        .select("balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;

      // If no wallet exists, create one with 0 balance
      if (!data) {
        const { data: newWallet, error: insertError } = await supabase
          .from("wallet_balances")
          .insert({ user_id: user.id, balance: 0 })
          .select("balance")
          .single();

        if (insertError) throw insertError;
        return Number(newWallet.balance);
      }

      return Number(data.balance);
    },
  });

  const addBalanceMutation = useMutation({
    mutationFn: async (amount: number) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("wallet_balances")
        .select("balance")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const newBalance = Number(data.balance) + amount;

      const { error: updateError } = await supabase
        .from("wallet_balances")
        .update({ balance: newBalance })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      return newBalance;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet-balance"] });
      toast({
        title: t("wallet.balanceAdded"),
        description: t("wallet.balanceAddedDescription"),
      });
    },
    onError: () => {
      toast({
        title: t("wallet.balanceError"),
        variant: "destructive",
      });
    },
  });

  const addTestBalance = () => {
    addBalanceMutation.mutate(25);
  };

  return {
    balance,
    isLoading,
    error,
    addTestBalance,
    isAddingBalance: addBalanceMutation.isPending,
  };
};
