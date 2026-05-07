import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Cable, AlertTriangle, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { chargersApi, commandsApi } from "@/services/api";
import type { ChargePoint } from "@/types/charger";
import carTopView from "@/assets/car-top-view.png";

export default function AguardandoPlug() {
  const { chargerId } = useParams<{ chargerId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const chargerFromState = location.state?.charger as ChargePoint | undefined;
  const [isStarting, setIsStarting] = useState(false);
  const [showTimeoutHint, setShowTimeoutHint] = useState(false);
  const startedAtRef = useRef<number>(Date.now());

  const { data: charger } = useQuery({
    queryKey: ["charger-detail", chargerId],
    queryFn: async () => {
      if (!chargerId) return null;
      const res = await chargersApi.get(chargerId);
      return res.data ?? null;
    },
    enabled: !!chargerId && !chargerFromState,
    initialData: chargerFromState ?? undefined,
  });

  const { data: status } = useQuery({
    queryKey: ["charger-ocpp-status-await", chargerId],
    queryFn: async () => {
      if (!chargerId) return null;
      const res = await commandsApi.getStatus(chargerId);
      return res.data ?? null;
    },
    refetchInterval: 3000,
    enabled: !!chargerId,
  });

  const ocppStatus = status?.ocppStatus;
  const isConnected = status?.isConnected ?? true;
  const isPreparing = ocppStatus === "Preparing";
  const isCharging = ocppStatus === "Charging";

  // If charger jumped straight to Charging (taken by another flow), bail out
  useEffect(() => {
    if (isCharging) {
      toast({
        title: "Estação ocupada",
        description: "Este carregador já está em uso por outra sessão.",
        variant: "destructive",
      });
      navigate("/");
    }
  }, [isCharging, navigate, toast]);

  // Timeout hint after 90s without Preparing
  useEffect(() => {
    if (isPreparing) {
      setShowTimeoutHint(false);
      return;
    }
    const id = setInterval(() => {
      if (Date.now() - startedAtRef.current > 90000) setShowTimeoutHint(true);
    }, 5000);
    return () => clearInterval(id);
  }, [isPreparing]);

  const handleStart = async () => {
    if (!chargerId || isStarting) return;
    setIsStarting(true);
    try {
      const res = await commandsApi.startCharge(chargerId);
      if (res.error || !res.data?.success) {
        const msg = res.data?.message || res.error || "Erro ao iniciar sessão";
        if (msg.includes("Insufficient balance")) {
          toast({ title: "Saldo insuficiente", description: "Adicione créditos à sua carteira para carregar.", variant: "destructive" });
        } else if (msg.includes("offline") || msg.includes("não está respondendo") || msg.includes("não está conectado")) {
          toast({ title: "Carregador offline", description: "Verifique a conexão e tente novamente.", variant: "destructive" });
        } else if (msg.includes("Remote start failed") || msg.includes("Rejected")) {
          toast({ title: "Falha ao iniciar", description: "O carregador rejeitou o início. Tente novamente.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao iniciar", description: msg, variant: "destructive" });
        }
        setIsStarting(false);
        return;
      }
      toast({ title: "Carregamento iniciado!", description: `Conectado em ${charger?.name ?? "carregador"}` });
      navigate(`/carregamento/${res.data.sessionId}`, {
        state: { charger, sessionId: res.data.sessionId },
      });
    } catch (e) {
      toast({ title: "Erro inesperado", variant: "destructive" });
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-white text-gray-900">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button onClick={() => navigate("/")} className="p-2 rounded-full hover:bg-gray-100 transition-colors" aria-label="Voltar">
          <ArrowLeft className="h-5 w-5 text-gray-900" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm text-gray-500">Conecte o plug</p>
          <h1 className="text-lg font-semibold">{charger?.name ?? "Carregador"}</h1>
        </div>
        <div className="w-9" />
      </div>

      <div className="flex-1 flex flex-col items-center px-4 pb-8 overflow-y-auto">
        {/* Visual */}
        <div className="relative flex items-center justify-center my-8" style={{ width: 280, height: 280 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)` }}
          />
          {!isPreparing && (
            <div className="absolute inset-0 rounded-full border-4 border-dashed border-primary/30 animate-spin" style={{ animationDuration: "8s" }} />
          )}
          <img src={carTopView} alt="Veículo" className="w-36 h-auto relative z-10" />
        </div>

        {/* Status text */}
        <div className="text-center mb-8 max-w-xs">
          {isPreparing ? (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <span className="text-base font-semibold text-primary">Plug conectado!</span>
              </div>
              <p className="text-sm text-gray-500">Toque no botão abaixo para iniciar o carregamento.</p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Cable className="h-5 w-5 text-yellow-500" />
                <span className="text-base font-semibold text-gray-900">Conecte o plug ao seu veículo</span>
              </div>
              <p className="text-sm text-gray-500">
                Aguardando o carregador detectar a conexão...
              </p>
            </>
          )}
        </div>

        {/* Offline warning */}
        {!isConnected && (
          <div className="w-full max-w-xs mb-4">
            <Alert className="bg-red-50 border-red-200">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-900">Carregador sem resposta</AlertTitle>
              <AlertDescription className="text-red-800">
                A estação não está enviando sinal. Tente outro carregador.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Timeout hint */}
        {showTimeoutHint && !isPreparing && isConnected && (
          <div className="w-full max-w-xs mb-4">
            <Alert className="bg-yellow-50 border-yellow-200">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertTitle className="text-yellow-900">Plug não detectado</AlertTitle>
              <AlertDescription className="text-yellow-800">
                Verifique se o cabo está bem encaixado no veículo e no carregador.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Action button */}
        <div className="w-full max-w-xs mt-auto space-y-2">
          <Button
            onClick={handleStart}
            disabled={!isPreparing || isStarting}
            className="w-full h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground disabled:opacity-50"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Iniciando...
              </>
            ) : (
              "Iniciar Carregamento"
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="w-full h-12 text-sm text-gray-500 hover:text-gray-900"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
