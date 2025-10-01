import { Edit, Trash2, Zap, MapPin, Plug } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChargerMiniChart } from "@/components/ChargerMiniChart";
import { useChargerStats } from "@/hooks/useChargerStats";
import { Skeleton } from "@/components/ui/skeleton";

interface Charger {
  id: string;
  name: string;
  location: string;
  status: "available" | "in_use" | "maintenance" | "offline";
  power: number;
  connector_type: string;
  price_per_kwh: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
}

interface ChargerCardModernProps {
  charger: Charger;
  onEdit: (charger: Charger) => void;
  onDelete: (charger: Charger) => void;
}

const statusConfig = {
  available: {
    label: "Disponível",
    color: "bg-green-500",
    borderColor: "border-l-green-500",
    badgeClass: "bg-green-100 text-green-700",
  },
  in_use: {
    label: "Em Uso",
    color: "bg-blue-500",
    borderColor: "border-l-blue-500",
    badgeClass: "bg-blue-100 text-blue-700",
  },
  maintenance: {
    label: "Manutenção",
    color: "bg-yellow-500",
    borderColor: "border-l-yellow-500",
    badgeClass: "bg-yellow-100 text-yellow-700",
  },
  offline: {
    label: "Offline",
    color: "bg-red-500",
    borderColor: "border-l-red-500",
    badgeClass: "bg-red-100 text-red-700",
  },
};

export const ChargerCardModern = ({ charger, onEdit, onDelete }: ChargerCardModernProps) => {
  const { data: stats, isLoading } = useChargerStats(charger.id);
  const config = statusConfig[charger.status as keyof typeof statusConfig] || statusConfig.available;

  return (
    <Card
      className={`group relative overflow-hidden border-l-4 ${config.borderColor} hover:shadow-xl transition-all duration-300 hover:-translate-y-1 backdrop-blur-sm bg-background/95`}
    >
      {/* Ícone marca d'água */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
        <Plug className="h-32 w-32" />
      </div>

      <div className="p-6 relative z-10">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Coluna principal - Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-xl font-bold">{charger.name}</h3>
                  <Badge className={config.badgeClass}>
                    {config.label}
                  </Badge>
                  {charger.status === 'in_use' && (
                    <div className="h-2 w-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {charger.location}
                  </span>
                  <Badge variant="outline" className="gap-1">
                    <Zap className="h-3 w-3" />
                    {charger.power} kW
                  </Badge>
                  <Badge variant="outline">{charger.connector_type}</Badge>
                </div>
              </div>
            </div>

            {/* Métricas em grid */}
            {isLoading ? (
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : stats ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.utilizationRate.toFixed(0)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Utilização</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    R$ {stats.totalRevenue.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Receita (7d)</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.sessionsCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Sessões</div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {stats.totalEnergy.toFixed(0)}
                  </div>
                  <div className="text-xs text-muted-foreground">kWh</div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Coluna de gráficos */}
          {!isLoading && stats && (
            <div className="lg:w-64 space-y-2">
              <div className="bg-green-50/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Sessões (7 dias)</div>
                <ChargerMiniChart data={stats.dailyData} dataKey="sessions" color="#22c55e" />
              </div>
              <div className="bg-green-50/50 rounded-lg p-3">
                <div className="text-xs text-muted-foreground mb-1">Receita (7 dias)</div>
                <ChargerMiniChart data={stats.dailyData} dataKey="revenue" color="#86efac" />
              </div>
            </div>
          )}

          {/* Ações */}
          <div className="flex lg:flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="outline"
              size="icon"
              onClick={() => onEdit(charger)}
              className="hover:bg-green-100 hover:text-green-600 hover:border-green-300"
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onDelete(charger)}
              className="hover:bg-red-100 hover:text-red-600 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
