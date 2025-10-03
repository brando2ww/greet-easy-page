import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface BillingInfo {
  id: string;
  user_id: string;
  full_name?: string;
  cpf?: string;
  street_address?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  created_at?: string;
  updated_at?: string;
}

export const useBillingInfo = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: billingInfo, isLoading } = useQuery({
    queryKey: ["billing-info"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("billing_info")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as BillingInfo | null;
    },
  });

  const updatePersonalInfo = useMutation({
    mutationFn: async (data: { full_name: string; cpf: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: existing } = await supabase
        .from("billing_info")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("billing_info")
          .update(data)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("billing_info")
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-info"] });
      toast({
        title: "Informações atualizadas",
        description: "Suas informações pessoais foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as informações. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error updating personal info:", error);
    },
  });

  const updateAddress = useMutation({
    mutationFn: async (data: {
      street_address: string;
      number: string;
      complement?: string;
      neighborhood: string;
      city: string;
      state: string;
      zip_code: string;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: existing } = await supabase
        .from("billing_info")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("billing_info")
          .update(data)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("billing_info")
          .insert({ ...data, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["billing-info"] });
      toast({
        title: "Endereço atualizado",
        description: "Seu endereço foi salvo com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o endereço. Tente novamente.",
        variant: "destructive",
      });
      console.error("Error updating address:", error);
    },
  });

  return {
    billingInfo,
    isLoading,
    updatePersonalInfo: updatePersonalInfo.mutate,
    updateAddress: updateAddress.mutate,
    isUpdatingPersonalInfo: updatePersonalInfo.isPending,
    isUpdatingAddress: updateAddress.isPending,
  };
};
