import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { chargersApi } from "@/services/api";

export const useChargerValidation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateAndStartSession = async (code: string) => {
    setIsLoading(true);
    
    try {
      // Get charger by code (UUID or OCPP charge point ID)
      const chargerResult = await chargersApi.getByCode(code);

      if (chargerResult.error || !chargerResult.data) {
        toast({
          title: "Estação não encontrada",
          description: "Verifique o código e tente novamente",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      const charger = chargerResult.data;

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
      const validOcppStatuses = ['Available', 'Preparing'];
      if (!validOcppStatuses.includes(charger.ocppProtocolStatus || '')) {
        toast({
          title: "Estação offline",
          description: "Esta estação não está conectada. Tente outra.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Check heartbeat freshness (must be within last 2 minutes)
      const lastHeartbeat = charger.lastHeartbeat ? new Date(charger.lastHeartbeat) : null;
      const ageMs = lastHeartbeat ? Date.now() - lastHeartbeat.getTime() : Infinity;
      const isConnected = ageMs < 600000; // 10 min — pong refreshes last_heartbeat every 60s

      if (!isConnected) {
        const ageMin = Number.isFinite(ageMs) ? Math.max(1, Math.round(ageMs / 60000)) : null;
        toast({
          title: "Carregador sem resposta",
          description: ageMin
            ? `Sem sinal há ${ageMin} min. Vá até o carregador, desligue e religue o disjuntor, aguarde 30s e tente novamente.`
            : "O carregador não está enviando sinal. Vá até o carregador, desligue e religue o disjuntor, aguarde 30s e tente novamente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Navigate to "awaiting plug" screen — RemoteStart only fires after Preparing detected
      navigate(`/aguardando-plug/${charger.id}`, { state: { charger } });

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
