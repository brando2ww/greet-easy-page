import { Activity, Zap, DollarSign, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

interface ChargersHeaderProps {
  stats: {
    total: number;
    available: number;
    inUse: number;
    maintenance: number;
  };
  globalUtilization: number;
}

export const ChargersHeader = ({ stats, globalUtilization }: ChargersHeaderProps) => {
  const metrics = [
    {
      label: "Total",
      value: stats.total,
      icon: Activity,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: "Disponíveis",
      value: stats.available,
      icon: Zap,
      color: "text-green-500",
      bgColor: "bg-green-50",
      pulse: true,
    },
    {
      label: "Em Uso",
      value: stats.inUse,
      icon: TrendingUp,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      pulse: stats.inUse > 0,
    },
    {
      label: "Manutenção",
      value: stats.maintenance,
      icon: DollarSign,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
  ];

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Métricas principais - horizontal scroll no mobile */}
      <div className="flex md:grid md:grid-cols-4 gap-2 md:gap-4 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="min-w-[140px] md:min-w-0 p-3 md:p-4 backdrop-blur-sm bg-background/95 border-green-200/50"
            >
              <div className="flex items-center gap-2">
                <div className={`p-1.5 md:p-2 rounded-lg ${metric.bgColor} ${metric.pulse ? 'animate-pulse' : ''}`}>
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${metric.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{metric.label}</p>
                  <p className="text-lg md:text-2xl font-bold">{metric.value}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Barra de utilização global - compacta */}
      <Card className="p-3 md:p-4 backdrop-blur-sm bg-background/95 border-green-200/50">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Utilização</span>
            <span className="font-bold text-sm">{globalUtilization.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 md:h-2 bg-green-50 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                globalUtilization > 80
                  ? 'bg-gradient-to-r from-yellow-400 to-red-500'
                  : globalUtilization > 50
                  ? 'bg-gradient-to-r from-green-400 to-yellow-400'
                  : 'bg-gradient-to-r from-green-400 to-green-500'
              }`}
              style={{ width: `${Math.min(globalUtilization, 100)}%` }}
            />
          </div>
        </div>
      </Card>
    </div>
  );
};
