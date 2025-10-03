import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ChargingSession {
  id: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  energy_consumed: number | null;
  cost: number | null;
  chargers: {
    name: string;
    location: string;
  } | null;
}

export const useChargingHistory = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["charging-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("charging_sessions")
        .select(`
          id,
          started_at,
          ended_at,
          status,
          energy_consumed,
          cost,
          chargers (
            name,
            location
          )
        `)
        .eq("user_id", user.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      return data as ChargingSession[];
    },
    enabled: !!user?.id,
  });
};
