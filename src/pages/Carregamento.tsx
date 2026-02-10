import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { transactionsApi, commandsApi } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/utils/formatters";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Zap, Clock, Battery, TrendingDown, PlugZap } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from "recharts";
import type { ChargePoint, Transaction } from "@/types/charger";

// OCPP status → label + indicator color
function getOcppStatusInfo(ocppStatus: string | null | undefined): { label: string; color: string; pulse: boolean } {
  switch (ocppStatus) {
    case "Available":
      return { label: "Aguardando plugue", color: "bg-yellow-500", pulse: true };
    case "Preparing":
      return { label: "Aguardando plugue", color: "bg-yellow-500", pulse: true };
    case "Charging":
      return { label: "Plugue Conectado", color: "bg-primary", pulse: true };
    case "SuspendedEVSE":
      return { label: "Pausado (Estação)", color: "bg-yellow-500", pulse: false };
    case "SuspendedEV":
      return { label: "Pausado (Veículo)", color: "bg-yellow-500", pulse: false };
    case "Finishing":
      return { label: "Finalizando...", color: "bg-blue-500", pulse: false };
    case "Faulted":
      return { label: "Erro no carregador", color: "bg-destructive", pulse: false };
    case "Unavailable":
      return { label: "Indisponível", color: "bg-destructive", pulse: false };
    default:
      return { label: "Conectando...", color: "bg-muted-foreground", pulse: true };
  }
}

export default function Carregamento() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isStopping, setIsStopping] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  const chargerFromState = location.state?.charger as ChargePoint | undefined;

  // Poll session data every 10s
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

  // Live elapsed timer
  const startedAt = session?.startedAt;
  useEffect(() => {
    if (!startedAt) return;
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

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
  const estimatedCost = cost > 0 ? cost : energyConsumed * pricePerKwh;
  const isCompleted = session?.status === "completed" || session?.status === "cancelled";

  const chargerId = chargerFromState?.id ?? session?.chargerId;

  // Poll real OCPP status every 10s
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
    ? { label: "Finalizado", color: "bg-muted-foreground", pulse: false }
    : getOcppStatusInfo(ocppStatus);

  // Fetch real weekly stats
  const { data: weeklyStats } = useQuery({
    queryKey: ["weekly-stats"],
    queryFn: async () => {
      const res = await transactionsApi.weeklyStats();
      return res.data ?? null;
    },
  });

  const chartData = (weeklyStats?.dailyData ?? []).map(d => ({
    name: d.dayLabel,
    value: d.energy,
  }));

  const handleStop = async () => {
    if (!session || !sessionId) return;
    setIsStopping(true);
    try {
      const res = await commandsApi.stopCharge(session.chargerId, session.transactionId ?? 0, sessionId);
      if (res.error || !res.data?.success) {
        toast({ title: "Erro ao parar", description: res.data?.message || res.error, variant: "destructive" });
      } else {
        toast({ title: "Carregamento finalizado!", description: "Sessão encerrada com sucesso." });
        navigate("/");
      }
    } catch {
      toast({ title: "Erro inesperado", variant: "destructive" });
    } finally {
      setIsStopping(false);
    }
  };

  // Animated progress (pulses between 60-90 while charging)
  const [progress, setProgress] = useState(65);
  useEffect(() => {
    if (isCompleted) { setProgress(100); return; }
    const id = setInterval(() => {
      setProgress((p) => (p >= 88 ? 62 : p + 0.5));
    }, 200);
    return () => clearInterval(id);
  }, [isCompleted]);

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-6 pb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="h-5 w-5 text-foreground" />
        </button>
        <h1 className="text-lg font-semibold text-foreground">Modo de Carregamento</h1>
      </div>

      <div className="flex-1 px-4 space-y-4 pb-28 overflow-y-auto">
        {/* Card 1 - Status */}
        <Card className="border-0 shadow-[var(--shadow-soft)]">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {statusInfo.label}
                </p>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    {statusInfo.pulse && (
                      <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusInfo.color} opacity-75`} />
                    )}
                    <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusInfo.color}`} />
                  </span>
                  <p className="text-sm font-medium text-foreground">
                    {isCompleted ? "Finalizado" : statusInfo.label}
                  </p>
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <PlugZap className="h-6 w-6 text-primary" />
              </div>
            </div>

            {/* Progress bar */}
            <Progress value={progress} className="h-2 bg-muted" />

            {/* Stats row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Battery className="h-4 w-4 text-primary" />
                <div>
                  <p className="text-2xl font-bold text-foreground">
                    {energyConsumed.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">kWh</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-secondary" />
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">
                    {formatElapsed(elapsed)}
                  </p>
                  <p className="text-xs text-muted-foreground">Duração</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 2 - Usage */}
        <Card className="border-0 shadow-[var(--shadow-soft)]">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Uso atual</p>
                <p className="text-xl font-bold text-foreground">{energyConsumed.toFixed(2)} kWh</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total gasto</p>
                <p className="text-xl font-bold text-primary">{formatCurrency(estimatedCost)}</p>
              </div>
            </div>

            {/* Bar chart */}
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} barCategoryGap="20%">
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((_, i) => (
                      <Cell key={i} fill={i === chartData.length - 1 ? "hsl(var(--primary))" : "hsl(var(--muted))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {weeklyStats && weeklyStats.previousPeriodTotal > 0 ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5 text-primary" />
                <span>
                  Você está usando{" "}
                  <strong className="text-foreground">
                    {Math.abs(weeklyStats.changePercent)}% {weeklyStats.changePercent <= 0 ? "menos" : "mais"}
                  </strong>{" "}
                  energia que a semana passada
                </span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Sem dados anteriores para comparar</p>
            )}
          </CardContent>
        </Card>

        {/* Charger info */}
        <div className="flex items-center gap-3 px-1">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">{chargerName}</p>
            <p className="text-xs text-muted-foreground">{chargerFromState?.location ?? session?.charger?.location ?? ""}</p>
          </div>
        </div>

        {/* Stop button */}
        {!isCompleted && (
          <Button
            onClick={() => setShowStopConfirm(true)}
            disabled={isStopping}
            variant="destructive"
            className="w-full h-14 text-base font-semibold rounded-2xl"
          >
            {isStopping ? "Parando..." : "Parar Carregamento"}
          </Button>
        )}

        <AlertDialog open={showStopConfirm} onOpenChange={setShowStopConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Parar Carregamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja encerrar esta sessão de carregamento? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { setShowStopConfirm(false); handleStop(); }}>
                Sim, Parar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isCompleted && (
          <Button
            onClick={() => navigate("/")}
            className="w-full h-14 text-base font-semibold rounded-2xl"
          >
            Voltar ao Início
          </Button>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <BottomNavigation />
      </div>
    </div>
  );
}
