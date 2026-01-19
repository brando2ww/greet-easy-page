import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, MapPin, Zap, Calendar, Battery } from "lucide-react";
import { useChargingHistory } from "@/hooks/useChargingHistory";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ChargingHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ChargingHistorySheet = ({ open, onOpenChange }: ChargingHistorySheetProps) => {
  const { data: sessions, isLoading } = useChargingHistory();

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Concluída</Badge>;
      case "in_progress":
        return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">Em andamento</Badge>;
      default:
        return <Badge variant="secondary">Cancelada</Badge>;
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 border-b p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onOpenChange(false)}
            className="hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5 rotate-180 text-foreground" />
          </Button>
          <h1 className="text-xl font-bold">Histórico</h1>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          ) : !sessions || sessions.length === 0 ? (
            // Estado vazio
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-6">
              <div className="relative">
                <MapPin className="w-16 h-16 text-muted-foreground/30" />
                <Zap className="w-8 h-8 text-muted-foreground/30 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-muted-foreground text-sm">
                Você ainda não fez cargas usando as estações Tupi
              </p>
            </div>
          ) : (
            // Lista de sessões
            <div className="space-y-3">
              {sessions.map((session) => (
                <Card key={session.id}>
                  <CardContent className="p-4 space-y-3">
                    {/* Título e Status */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm">
                          {session.charger?.name || "Carregador"}
                        </h3>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {session.charger?.location || "Localização não disponível"}
                        </p>
                      </div>
                      {getStatusBadge(session.status)}
                    </div>

                    {/* Data */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>
                        {format(new Date(session.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </span>
                    </div>

                    {/* Energia e Custo */}
                    {(session.energyConsumed || session.cost) && (
                      <div className="flex items-center justify-between pt-2 border-t">
                        {session.energyConsumed && (
                          <div className="flex items-center gap-1.5 text-sm">
                            <Battery className="w-4 h-4 text-green-600" />
                            <span className="font-medium">{session.energyConsumed.toFixed(2)} kWh</span>
                          </div>
                        )}
                        {session.cost && (
                          <span className="text-sm font-bold text-primary">
                            R$ {session.cost.toFixed(2)}
                          </span>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
