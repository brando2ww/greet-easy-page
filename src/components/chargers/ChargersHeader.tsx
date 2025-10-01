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
    <div className="space-y-6">
      {/* Métricas principais */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          return (
            <Card
              key={metric.label}
              className="p-4 backdrop-blur-sm bg-background/95 border-green-200/50 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <p className="text-3xl font-bold mt-1 animate-fade-in">
                    {metric.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor} ${metric.pulse ? 'animate-pulse' : ''}`}>
                  <Icon className={`h-6 w-6 ${metric.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Barra de utilização global */}
      <Card className="p-6 backdrop-blur-sm bg-background/95 border-green-200/50">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Utilização da Rede</span>
            <span className="font-bold text-lg">{globalUtilization.toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-green-50 rounded-full overflow-hidden">
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
