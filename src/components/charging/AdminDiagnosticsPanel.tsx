import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { diagnosticsApi } from "@/services/api";
import { Bug, FileText, Settings, ToggleLeft, RefreshCw } from "lucide-react";

interface AdminDiagnosticsPanelProps {
  chargePointId: string | null | undefined;
}

const KEYS_OF_INTEREST = [
  "AuthorizeRemoteTxRequests",
  "MinimumStatusDuration",
  "AuthorizationCacheEnabled",
  "LocalAuthListEnabled",
  "StopTransactionOnEVSideDisconnect",
  "ConnectionTimeOut",
  "HeartbeatInterval",
];

export function AdminDiagnosticsPanel({ chargePointId }: AdminDiagnosticsPanelProps) {
  const { toast } = useToast();
  const [showMessages, setShowMessages] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [togglingAuth, setTogglingAuth] = useState(false);
  const [messages, setMessages] = useState<Array<{ timestamp: string; direction: string; action: string; payload: unknown }>>([]);
  const [configRows, setConfigRows] = useState<Array<{ key: string; readonly: boolean; value?: string }>>([]);
  const [unknownKeys, setUnknownKeys] = useState<string[]>([]);

  if (!chargePointId) {
    return (
      <div className="rounded-xl border border-dashed border-muted p-3 text-xs text-muted-foreground">
        Diagnóstico admin indisponível: carregador sem <code>ocpp_charge_point_id</code>.
      </div>
    );
  }

  const loadMessages = async () => {
    setLoadingMessages(true);
    try {
      const res = await diagnosticsApi.getMessages(chargePointId, 100);
      if (res.error) {
        toast({ title: "Erro ao carregar mensagens", description: res.error, variant: "destructive" });
      } else {
        setMessages(res.data?.messages ?? []);
        setShowMessages(true);
      }
    } finally {
      setLoadingMessages(false);
    }
  };

  const loadConfig = async () => {
    setLoadingConfig(true);
    try {
      const res = await diagnosticsApi.getConfig(chargePointId, KEYS_OF_INTEREST);
      if (res.error || res.data?.success === false) {
        toast({
          title: "Erro ao ler configuração",
          description: res.error || res.data?.message || "Carregador não respondeu",
          variant: "destructive",
        });
      } else {
        setConfigRows(res.data?.result?.configurationKey ?? []);
        setUnknownKeys(res.data?.result?.unknownKey ?? []);
        setShowConfig(true);
      }
    } finally {
      setLoadingConfig(false);
    }
  };

  const toggleAuthorizeRemote = async () => {
    setTogglingAuth(true);
    try {
      const res = await diagnosticsApi.changeConfig(chargePointId, "AuthorizeRemoteTxRequests", "false");
      if (res.error || res.data?.success === false) {
        toast({
          title: "Falha ao trocar config",
          description: res.error || res.data?.message,
          variant: "destructive",
        });
      } else {
        const status = res.data?.result?.status;
        toast({
          title: `ChangeConfiguration: ${status}`,
          description:
            status === "Accepted"
              ? "AuthorizeRemoteTxRequests=false. Tente o RemoteStart de novo."
              : status === "RebootRequired"
              ? "Aceito mas requer reboot do carregador."
              : "Carregador não aceitou a alteração.",
          variant: status === "Accepted" || status === "RebootRequired" ? "default" : "destructive",
        });
      }
    } finally {
      setTogglingAuth(false);
    }
  };

  const triggerMeterValues = async () => {
    setTriggeringMeter(true);
    try {
      const res = await diagnosticsApi.trigger(chargePointId, "MeterValues", 1);
      if (res.error || res.data?.success === false) {
        toast({
          title: "Falha ao solicitar MeterValues",
          description: res.error || res.data?.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "TriggerMessage MeterValues enviado", description: "Aguardando resposta do carregador." });
      }
    } finally {
      setTriggeringMeter(false);
    }
  };

  const softReset = async () => {
    setResetting(true);
    try {
      const res = await diagnosticsApi.reset(chargePointId, "Soft");
      if (res.error || res.data?.success === false) {
        toast({
          title: "Falha no Soft Reset",
          description: res.error || res.data?.message,
          variant: "destructive",
        });
      } else {
        const status = res.data?.result?.status;
        toast({
          title: `Reset: ${status || "enviado"}`,
          description: status === "Accepted"
            ? "O carregador vai reiniciar. Aguarde a reconexão."
            : "Carregador respondeu, verifique buffer.",
        });
      }
    } finally {
      setResetting(false);
    }
  };

  return (
    <>
      <div className="rounded-xl border border-orange-300 bg-orange-50 p-3">
        <div className="flex items-center gap-1.5 mb-2">
          <Bug className="h-3.5 w-3.5 text-orange-700" />
          <span className="text-xs font-semibold text-orange-900 uppercase tracking-wide">
            Diagnóstico OCPP (admin) — CP {chargePointId}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={loadMessages}
            disabled={loadingMessages}
            className="border-orange-300 bg-white hover:bg-orange-100 text-orange-900 justify-start"
          >
            <FileText className={`h-3.5 w-3.5 mr-1.5 ${loadingMessages ? "animate-pulse" : ""}`} />
            {loadingMessages ? "Carregando..." : "Ver buffer OCPP"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={loadConfig}
            disabled={loadingConfig}
            className="border-orange-300 bg-white hover:bg-orange-100 text-orange-900 justify-start"
          >
            <Settings className={`h-3.5 w-3.5 mr-1.5 ${loadingConfig ? "animate-spin" : ""}`} />
            {loadingConfig ? "Lendo..." : "Ler config"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={toggleAuthorizeRemote}
            disabled={togglingAuth}
            className="border-orange-300 bg-white hover:bg-orange-100 text-orange-900 justify-start"
          >
            <ToggleLeft className={`h-3.5 w-3.5 mr-1.5 ${togglingAuth ? "animate-pulse" : ""}`} />
            {togglingAuth ? "Aplicando..." : "AuthRemoteTx=false"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={triggerMeterValues}
            disabled={triggeringMeter}
            className="border-orange-300 bg-white hover:bg-orange-100 text-orange-900 justify-start"
          >
            <Activity className={`h-3.5 w-3.5 mr-1.5 ${triggeringMeter ? "animate-pulse" : ""}`} />
            {triggeringMeter ? "Enviando..." : "Trigger MeterValues"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={softReset}
            disabled={resetting}
            className="border-orange-300 bg-white hover:bg-orange-100 text-orange-900 justify-start"
          >
            <RotateCw className={`h-3.5 w-3.5 mr-1.5 ${resetting ? "animate-spin" : ""}`} />
            {resetting ? "Reiniciando..." : "Soft Reset"}
          </Button>
        </div>
      </div>

      {/* Messages dialog */}
      <Dialog open={showMessages} onOpenChange={setShowMessages}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Buffer OCPP — {chargePointId}</span>
              <Button size="sm" variant="ghost" onClick={loadMessages} disabled={loadingMessages}>
                <RefreshCw className={`h-3.5 w-3.5 ${loadingMessages ? "animate-spin" : ""}`} />
              </Button>
            </DialogTitle>
            <DialogDescription>
              {messages.length} mensagens (mais recente no fim).
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[60vh] rounded border bg-muted/30">
            <div className="p-2 space-y-1.5 text-xs font-mono">
              {messages.length === 0 && (
                <div className="text-muted-foreground text-center py-8">
                  Nenhuma mensagem registrada para este CP.
                </div>
              )}
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`p-2 rounded border ${
                    m.direction === "in"
                      ? "bg-blue-50 border-blue-200"
                      : "bg-green-50 border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={m.direction === "in" ? "default" : "secondary"} className="text-[10px]">
                      {m.direction === "in" ? "← IN" : "OUT →"}
                    </Badge>
                    <span className="font-semibold">{m.action}</span>
                    <span className="text-muted-foreground ml-auto text-[10px]">
                      {new Date(m.timestamp).toLocaleTimeString("pt-BR", { hour12: false })}
                    </span>
                  </div>
                  <pre className="text-[10px] whitespace-pre-wrap break-all text-foreground/80">
                    {JSON.stringify(m.payload, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Config dialog */}
      <Dialog open={showConfig} onOpenChange={setShowConfig}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Configuração OCPP — {chargePointId}</DialogTitle>
            <DialogDescription>
              Valores reportados pelo carregador via GetConfiguration.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="space-y-2">
              {configRows.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-6">
                  Carregador não retornou nenhuma chave conhecida.
                </div>
              )}
              {configRows.map((row) => (
                <div key={row.key} className="flex items-start justify-between gap-3 p-2 rounded border bg-muted/30">
                  <div className="flex-1">
                    <div className="text-sm font-medium">{row.key}</div>
                    <div className="text-xs text-muted-foreground font-mono break-all">
                      {row.value ?? "(empty)"}
                    </div>
                  </div>
                  {row.readonly && (
                    <Badge variant="outline" className="text-[10px]">readonly</Badge>
                  )}
                </div>
              ))}
              {unknownKeys.length > 0 && (
                <div className="pt-2 border-t">
                  <div className="text-xs font-semibold text-muted-foreground mb-1">Chaves desconhecidas:</div>
                  <div className="flex flex-wrap gap-1">
                    {unknownKeys.map((k) => (
                      <Badge key={k} variant="outline" className="text-[10px]">{k}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
