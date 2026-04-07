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
      const isConnected = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) < 120000 : false;

      if (!isConnected) {
        toast({
          title: "Carregador offline",
          description: "O carregador não está respondendo. Verifique a conexão e tente novamente.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Start charging session via API
      const startResult = await commandsApi.startCharge(charger.id);

      if (startResult.error || !startResult.data?.success) {
        const errorMessage = startResult.data?.message || startResult.error || 'Erro ao iniciar sessão';
        
        // Handle specific errors
        if (errorMessage.includes('Insufficient balance')) {
          toast({
            title: "Saldo insuficiente",
            description: "Adicione créditos à sua carteira para carregar",
            variant: "destructive",
          });
        } else if (errorMessage.includes('Authentication required')) {
          toast({
            title: "Erro de autenticação",
            description: "Faça login para iniciar o carregamento",
            variant: "destructive",
          });
          navigate('/auth');
        } else if (errorMessage.includes('não está respondendo') || errorMessage.includes('offline') || errorMessage.includes('not connected') || errorMessage.includes('não está conectado')) {
          toast({
            title: "Carregador offline",
            description: "O carregador não está respondendo. Verifique a conexão e tente novamente.",
            variant: "destructive",
          });
        } else if (errorMessage.includes('Remote start failed')) {
          toast({
            title: "Falha ao iniciar",
            description: "Não foi possível iniciar o carregamento remotamente. Tente novamente.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro ao iniciar sessão",
            description: errorMessage,
            variant: "destructive",
          });
        }
        setIsLoading(false);
        return;
      }

      // Success! Show toast and navigate
      toast({
        title: "Carregamento iniciado!",
        description: `Conectado em ${charger.name}`,
      });

      // Navigate to active charging page with session data
      navigate(`/carregamento/${startResult.data.sessionId}`, {
        state: { charger, sessionId: startResult.data.sessionId }
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
