import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { chargersApi, commandsApi } from "@/services/api";

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

      // Live check via OCPP server (independent of DB freshness, auto-heals)
      let isLive = false;
      try {
        const live = await chargersApi.liveStatus
          ? await (chargersApi as any).liveStatus(charger.id)
          : null;
        isLive = !!live?.data?.isLive;
      } catch {}

      // Fallback to DB heartbeat freshness if live check inconclusive
      const validOcppStatuses = ['Available', 'Preparing'];
      const dbOk = validOcppStatuses.includes(charger.ocppProtocolStatus || '');
      const lastHeartbeat = charger.lastHeartbeat ? new Date(charger.lastHeartbeat) : null;
      const ageMs = lastHeartbeat ? Date.now() - lastHeartbeat.getTime() : Infinity;
      const dbFresh = ageMs < 600000;

      if (!isLive && !(dbOk && dbFresh)) {
        toast({
          title: "Carregador desconectado",
          description: "Vá até a estação, desligue e religue o disjuntor, aguarde 30s e tente novamente.",
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
