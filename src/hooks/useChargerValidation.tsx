import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Charger {
  id: string;
  name: string;
  location: string;
  status: string;
  ocpp_protocol_status: string | null;
  power: number;
  price_per_kwh: number;
  connector_type: string;
}

export const useChargerValidation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateAndStartSession = async (code: string) => {
    setIsLoading(true);
    
    try {
      // Try to find charger by ID or charge point ID
      const { data: charger, error } = await supabase
        .from('chargers')
        .select('*')
        .or(`id.eq.${code},ocpp_charge_point_id.eq.${code}`)
        .single();

      if (error || !charger) {
        toast({
          title: "Estação não encontrada",
          description: "Verifique o código e tente novamente",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check if charger is available
      if (charger.status !== 'available') {
        const statusMessages: Record<string, string> = {
          in_use: 'em uso',
          maintenance: 'em manutenção',
          offline: 'fora de serviço'
        };
        toast({
          title: "Estação indisponível",
          description: `Esta estação está ${statusMessages[charger.status] || 'indisponível'}`,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check OCPP connection status
      if (charger.ocpp_protocol_status !== 'Available') {
        toast({
          title: "Estação offline",
          description: "Esta estação não está conectada. Tente outra.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Erro de autenticação",
          description: "Faça login para iniciar o carregamento",
          variant: "destructive",
        });
        navigate('/auth');
        setIsLoading(false);
        return;
      }

      // Create charging session
      const { data: session, error: sessionError } = await supabase
        .from('charging_sessions')
        .insert({
          charger_id: charger.id,
          user_id: user.id,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError || !session) {
        toast({
          title: "Erro ao iniciar sessão",
          description: "Tente novamente",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Success! Show toast and navigate
      toast({
        title: "Carregamento iniciado!",
        description: `Conectado em ${charger.name}`,
      });

      // Navigate to active charging page with session data
      navigate(`/carregamento/${session.id}`, {
        state: { charger, session }
      });

    } catch (error) {
      console.error('Validation error:', error);
      toast({
        title: "Erro inesperado",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return { validateAndStartSession, isLoading };
};
