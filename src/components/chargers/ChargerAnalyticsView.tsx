import { Card } from "@/components/ui/card";
import { useChargerStats } from "@/hooks/useChargerStats";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Zap, DollarSign } from "lucide-react";

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
  serial_number: string | null;
  partner_client_id: string | null;
  created_at: string;
  updated_at: string;
}

interface ChargerAnalyticsViewProps {
  chargers: Charger[];
}

const ChargerAnalytics = ({ charger }: { charger: Charger }) => {
  const { data: stats, isLoading } = useChargerStats(charger.id);

  if (isLoading) {
    return <Skeleton className="h-32" />;
  }

  if (!stats) return null;

      return {
        name: charger.name.length > 15 ? charger.name.substring(0, 15) + "..." : charger.name,
        revenue: stats.totalRevenue,
        sessions: stats.sessionsCount,
        utilization: stats.utilizationRate,
        energy: stats.totalEnergy,
      };
};

export const ChargerAnalyticsView = ({ chargers }: ChargerAnalyticsViewProps) => {
  const analyticsData = chargers
    .map((charger) => {
      const { data: stats } = useChargerStats(charger.id);
      if (!stats) return null;
      return {
        name: charger.name.length > 15 ? charger.name.substring(0, 15) + "..." : charger.name,
        revenue: stats.totalRevenue,
        sessions: stats.sessionsCount,
        utilization: stats.utilizationRate,
        energy: stats.totalEnergy,
      };
    })
    .filter(Boolean);

  // Top performers
  const topByRevenue = [...chargers]
    .map((c) => {
      const { data: stats } = useChargerStats(c.id);
      return { ...c, revenue: stats?.totalRevenue || 0 };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  const topBySessions = [...chargers]
    .map((c) => {
      const { data: stats } = useChargerStats(c.id);
      return { ...c, sessions: stats?.sessionsCount || 0 };
    })
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Top Performers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 backdrop-blur-sm bg-background/95 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Top 3 - Receita (7 dias)</h3>
          </div>
          <div className="space-y-3">
            {topByRevenue.map((charger, index) => (
              <div key={charger.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`
                    flex items-center justify-center h-8 w-8 rounded-full font-bold
                    ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
                    ${index === 1 ? 'bg-gray-300 text-gray-700' : ''}
                    ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{charger.name}</span>
                </div>
                <span className="font-bold text-primary">R$ {charger.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6 backdrop-blur-sm bg-background/95 border-primary/20">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Top 3 - Sessões (7 dias)</h3>
          </div>
          <div className="space-y-3">
            {topBySessions.map((charger, index) => (
              <div key={charger.id} className="flex items-center justify-between p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`
                    flex items-center justify-center h-8 w-8 rounded-full font-bold
                    ${index === 0 ? 'bg-yellow-400 text-yellow-900' : ''}
                    ${index === 1 ? 'bg-gray-300 text-gray-700' : ''}
                    ${index === 2 ? 'bg-orange-400 text-orange-900' : ''}
                  `}>
                    {index + 1}
                  </div>
                  <span className="font-medium">{charger.name}</span>
                </div>
                <span className="font-bold text-primary">{charger.sessions} sessões</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Gráficos comparativos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Receita por carregador */}
        <Card className="p-6 backdrop-blur-sm bg-background/95 border-primary/20">
          <h3 className="font-bold text-lg mb-4">Receita por Carregador (7 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #bfd13b',
                  borderRadius: '8px' 
                }}
                formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Receita']}
              />
              <Bar dataKey="revenue" fill="#bfd13b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Sessões por carregador */}
        <Card className="p-6 backdrop-blur-sm bg-background/95 border-primary/20">
          <h3 className="font-bold text-lg mb-4">Sessões por Carregador (7 dias)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #bfd13b',
                  borderRadius: '8px' 
                }}
                formatter={(value: number) => [value, 'Sessões']}
              />
              <Bar dataKey="sessions" fill="#bfd13b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Taxa de utilização */}
        <Card className="p-6 backdrop-blur-sm bg-background/95 border-primary/20">
          <h3 className="font-bold text-lg mb-4">Taxa de Utilização (%)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #bfd13b',
                  borderRadius: '8px' 
                }}
                formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilização']}
              />
              <Line 
                type="monotone" 
                dataKey="utilization" 
                stroke="#bfd13b" 
                strokeWidth={3}
                dot={{ fill: '#22c55e', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Energia total */}
        <Card className="p-6 backdrop-blur-sm bg-background/95 border-primary/20">
          <h3 className="font-bold text-lg mb-4">Energia Entregue (kWh)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                  border: '1px solid #bfd13b',
                  borderRadius: '8px' 
                }}
                formatter={(value: number) => [`${value.toFixed(2)} kWh`, 'Energia']}
              />
              <Bar dataKey="energy" fill="#bfd13b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
};
