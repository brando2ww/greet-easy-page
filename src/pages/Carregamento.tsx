import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi, commandsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useWalletBalance } from "@/hooks/useWalletBalance";
import { formatCurrency } from "@/utils/formatters";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, DollarSign, Zap, WifiOff, Square } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ChargePoint, Transaction } from "@/types/charger";
import carTopView from "@/assets/car-top-view.png";

function getOcppStatusInfo(ocppStatus: string | null | undefined): { label: string; color: string; pulse: boolean } {
  switch (ocppStatus) {
    case "Available":
    case "Preparing":
      return { label: "Aguardando plugue", color: "text-yellow-500", pulse: true };
    case "Charging":
      return { label: "Carregando", color: "text-primary", pulse: true };
    case "SuspendedEVSE":
      return { label: "Pausado (Estação)", color: "text-yellow-500", pulse: false };
    case "SuspendedEV":
      return { label: "Pausado (Veículo)", color: "text-yellow-500", pulse: false };
    case "Finishing":
      return { label: "Finalizando...", color: "text-blue-400", pulse: false };
    case "Faulted":
      return { label: "Erro no carregador", color: "text-red-500", pulse: false };
    case "Unavailable":
      return { label: "Indisponível", color: "text-red-500", pulse: false };
    default:
      return { label: "Conectando...", color: "text-gray-400", pulse: true };
  }
}

export default function Carregamento() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { balance } = useWalletBalance();
  const [isStopping, setIsStopping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const balanceStopTriggeredRef = useRef(false);

  const chargerFromState = location.state?.charger as ChargePoint | undefined;

  const { data: session } = useQuery({
    queryKey: ["charging-session", sessionId],
    queryFn: async () => {
      if (!sessionId) return null;
      const res = await transactionsApi.get(sessionId);
      return res.data ?? null;
    },
    refetchInterval: 10000,
    enabled: !!sessionId,
  });

  const accumulatedRef = useRef(0);
  const chargingStartRef = useRef<number | null>(null);

  const formatElapsed = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const energyConsumed = session?.energyConsumed ?? 0;
  const cost = session?.cost ?? 0;
  const chargerName = chargerFromState?.name ?? session?.charger?.name ?? "Carregador";
  const pricePerKwh = chargerFromState?.pricePerKwh ?? 0;
  const isCompleted = session?.status === "completed" || session?.status === "cancelled";
  const isAwaitingPlug = (session?.status as string) === "awaiting_plug";
  const estimatedCost = isAwaitingPlug ? 0 : (cost > 0 ? cost : energyConsumed * pricePerKwh);

  const chargerId = chargerFromState?.id ?? session?.chargerId;

  const { data: chargerStatusRes } = useQuery({
    queryKey: ["charger-ocpp-status", chargerId],
    queryFn: async () => {
      if (!chargerId) return null;
      const res = await commandsApi.getStatus(chargerId);
      return res.data ?? null;
    },
    refetchInterval: 10000,
    enabled: !!chargerId && !isCompleted,
  });

  const ocppStatus = chargerStatusRes?.ocppStatus;
  const statusInfo = isCompleted
    ? { label: "Finalizado", color: "text-gray-400", pulse: false }
    : isAwaitingPlug
    ? { label: "Aguardando conexão do plugue", color: "text-yellow-500", pulse: true }
    : getOcppStatusInfo(ocppStatus);

  const activeStatuses = ["Charging", "SuspendedEV", "SuspendedEVSE", "Finishing"];
  const isActivelyCharging = !isCompleted && activeStatuses.includes(ocppStatus ?? "");

  useEffect(() => {
    if (isActivelyCharging) {
      if (!chargingStartRef.current) {
        chargingStartRef.current = Date.now();
      }
      const tick = () => {
        const sinceStart = Math.floor((Date.now() - chargingStartRef.current!) / 1000);
        setElapsed(accumulatedRef.current + sinceStart);
      };
      tick();
      const id = setInterval(tick, 1000);
      return () => clearInterval(id);
    } else {
      if (chargingStartRef.current) {
        accumulatedRef.current += Math.floor((Date.now() - chargingStartRef.current) / 1000);
        chargingStartRef.current = null;
      }
    }
  }, [isActivelyCharging]);

  useEffect(() => {
    if (balanceStopTriggeredRef.current || !isActivelyCharging) return;
    const margin = balance - estimatedCost;
    if (margin < 1.0) {
      balanceStopTriggeredRef.current = true;
      toast({ title: "Saldo insuficiente", description: "Carregamento suspenso automaticamente.", variant: "destructive" });
      handleStop();
    }
  }, [balance, estimatedCost, isActivelyCharging]);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
      offlineTimerRef.current = setTimeout(() => {
        if (isActivelyCharging) {
          toast({ title: "Sem conexão", description: "Carregamento suspenso por falta de internet.", variant: "destructive" });
          handleStop();
        }
      }, 15000);
    };
    const handleOnline = () => {
      setIsOffline(false);
      if (offlineTimerRef.current) { clearTimeout(offlineTimerRef.current); offlineTimerRef.current = null; }
    };
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    if (!navigator.onLine) handleOffline();
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [isActivelyCharging]);

  const handleStop = async () => {
    if (!session || !sessionId) return;
    setIsStopping(true);
    try {
      const res = await commandsApi.stopCharge(session.chargerId, session.transactionId ?? 0, sessionId);
      if (res.error || !res.data?.success) {
        toast({ title: "Erro ao parar", description: res.data?.message || res.error, variant: "destructive" });
        if (chargerId) { try { await commandsApi.getStatus(chargerId); } catch {} }
      } else {
        toast({ title: "Carregamento finalizado!", description: "Sessão encerrada com sucesso." });
        navigate("/");
      }
    } catch {
      toast({ title: "Erro inesperado", variant: "destructive" });
      if (chargerId) { try { await commandsApi.getStatus(chargerId); } catch {} }
    } finally {
      setIsStopping(false);
    }
  };

  // Circular progress
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const [progressAngle, setProgressAngle] = useState(0);

  useEffect(() => {
    if (isCompleted) { setProgressAngle(1); return; }
    const id = setInterval(() => {
      setProgressAngle((p) => (p >= 0.88 ? 0.55 : p + 0.003));
    }, 100);
    return () => clearInterval(id);
  }, [isCompleted]);

  const offset = circumference - progressAngle * circumference;

  // Battery segments
  const totalSegments = 10;
  const filledSegments = isCompleted ? totalSegments : Math.max(1, Math.floor(progressAngle * totalSegments));

  return (
    <div className="flex flex-col min-h-[100dvh] bg-gray-950 text-white">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-2">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex-1 text-center">
          <p className="text-sm text-gray-400">Veículo Elétrico</p>
          <h1 className="text-lg font-semibold">{chargerName}</h1>
        </div>
        <div className="w-9" />
      </div>

      {/* Offline banner */}
      {isOffline && (
        <div className="mx-4 mb-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2">
          <WifiOff className="h-4 w-4 text-red-400" />
          <span className="text-sm font-medium text-red-400">Sem conexão com a internet</span>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center px-4 pb-28 overflow-y-auto">
        {/* Car + circular progress */}
        <div className="relative flex items-center justify-center my-6" style={{ width: 280, height: 280 }}>
          {/* Glow effect */}
          <div className="absolute inset-0 rounded-full" style={{
            background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
          }} />

          {/* Background ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 280 280">
            <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
            <circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              className="transition-all duration-300"
              style={{
                filter: "drop-shadow(0 0 8px hsl(var(--primary) / 0.5))",
              }}
            />
          </svg>

          {/* Car image */}
          <img src={carTopView} alt="Veículo" className="w-36 h-auto relative z-10" />
        </div>

        {/* Status + timer */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-1">
            {statusInfo.pulse && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
            )}
            <span className={`text-sm font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
          </div>
          <p className="text-3xl font-bold tracking-wider font-mono">{formatElapsed(elapsed)}</p>
        </div>

        {/* Battery segments */}
        <div className="w-full max-w-xs mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Progresso</span>
            <span className="text-xs font-semibold text-primary">{Math.round(progressAngle * 100)}%</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalSegments }).map((_, i) => (
              <div
                key={i}
                className={`h-2.5 flex-1 rounded-full transition-all duration-300 ${
                  i < filledSegments ? "bg-primary shadow-[0_0_6px_hsl(var(--primary)/0.4)]" : "bg-white/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stats row */}
        <div className="w-full max-w-xs grid grid-cols-3 gap-3 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Clock className="h-5 w-5 text-gray-400 mx-auto mb-2" />
            <p className="text-lg font-bold">{Math.floor(elapsed / 60)}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Minutos</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <DollarSign className="h-5 w-5 text-gray-400 mx-auto mb-2" />
            <p className="text-lg font-bold">{formatCurrency(estimatedCost)}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Custo</p>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center">
            <Zap className="h-5 w-5 text-gray-400 mx-auto mb-2" />
            <p className="text-lg font-bold">{energyConsumed.toFixed(1)}</p>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">kWh</p>
          </div>
        </div>

        {/* Stop / Back button */}
        {!isCompleted ? (
          <Button
            onClick={() => setShowStopConfirm(true)}
            disabled={isStopping}
            className="w-full max-w-xs h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Square className="h-4 w-4 mr-2 fill-current" />
            {isStopping ? "Parando..." : "Parar Carregamento"}
          </Button>
        ) : (
          <Button
            onClick={() => navigate("/")}
            className="w-full max-w-xs h-14 text-base font-semibold rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Voltar ao Início
          </Button>
        )}
      </div>

      <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
        <AlertDialogContent className="bg-gray-900 border-gray-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Parar Carregamento?</AlertDialogTitle>
            <AlertDialogDescription className="text-gray-400">
              Tem certeza que deseja encerrar esta sessão de carregamento? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-gray-800 border-gray-700 text-white hover:bg-gray-700">Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowStopConfirm(false); handleStop(); }} className="bg-primary text-primary-foreground">
              Sim, Parar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation />
      </div>
    </div>
  );
}
