import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  MapPin, 
  Edit, 
  Trash2,
  TrendingUp,
  Percent,
  DollarSign,
  Activity
} from 'lucide-react';
import { useChargerStats } from '@/hooks/useChargerStats';
import { ChargerMiniChart } from './ChargerMiniChart';
import { useTranslation } from 'react-i18next';

type Charger = {
  id: string;
  name: string;
  location: string;
  power: number;
  connector_type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  price_per_kwh: number;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

interface ChargerCardProps {
  charger: Charger;
  onEdit: (charger: Charger) => void;
  onDelete: (id: string) => void;
}

export const ChargerCard = ({ charger, onEdit, onDelete }: ChargerCardProps) => {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useChargerStats(charger.id);

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      available: { label: t('admin.available'), className: 'bg-primary/10 text-primary border-primary/20' },
      in_use: { label: t('admin.inUse'), className: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
      maintenance: { label: t('admin.maintenance'), className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' },
      offline: { label: t('admin.offline'), className: 'bg-red-500/10 text-red-600 border-red-500/20' },
    };
    const config = statusConfig[status as keyof typeof statusConfig];
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getChargerCardStyle = (status: string) => {
    if (status === 'available') {
      return {
        card: 'bg-gradient-to-br from-primary to-primary/80 border-transparent shadow-xl hover:shadow-2xl hover:scale-[1.02]',
        text: 'text-white',
        iconColor: 'text-white',
        badge: 'bg-white/20 text-white border-white/30',
      };
    }
    return {
      card: 'bg-white border-gray-200 shadow-md hover:shadow-lg',
      text: 'text-foreground',
      iconColor: 'text-primary opacity-60',
      badge: 'bg-gray-100 text-gray-700 border-gray-200',
    };
  };

  const cardStyle = getChargerCardStyle(charger.status);

  return (
    <Card className={`rounded-3xl transition-all duration-300 animate-fade-in ${cardStyle.card}`}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-4">
          <Zap className={`h-16 w-16 ${cardStyle.iconColor}`} />
          <Badge className={cardStyle.badge}>{getStatusBadge(charger.status)}</Badge>
        </div>
        <CardTitle className={`text-2xl ${cardStyle.text}`}>{charger.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className={`flex items-center text-sm ${cardStyle.text}`}>
          <MapPin className="h-5 w-5 mr-2" />
          <span>{charger.location}</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className={`mb-1 ${cardStyle.text} opacity-80`}>Potência</p>
            <p className={`font-semibold text-base ${cardStyle.text}`}>{charger.power} kW</p>
          </div>
          <div>
            <p className={`mb-1 ${cardStyle.text} opacity-80`}>Preço</p>
            <p className={`font-semibold text-base ${cardStyle.text}`}>
              R$ {Number(charger.price_per_kwh).toFixed(2)}/kWh
            </p>
          </div>
        </div>

        <div>
          <p className={`text-sm mb-1 ${cardStyle.text} opacity-80`}>Conector</p>
          <p className={`font-semibold ${cardStyle.text}`}>{charger.connector_type}</p>
        </div>

        {/* Statistics Section */}
        {!statsLoading && stats && (
          <>
            <div className={`border-t pt-4 space-y-3 ${charger.status === 'available' ? 'border-white/20' : 'border-gray-200'}`}>
              {/* Utilization Rate & Sessions */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-white/10 ${charger.status !== 'available' && 'bg-gray-50'} rounded-xl p-3`}>
                  <div className="flex items-center gap-1 mb-1">
                    <Percent className={`h-3.5 w-3.5 ${cardStyle.text}`} />
                    <p className={`text-xs ${cardStyle.text} opacity-70`}>Taxa Utilização</p>
                  </div>
                  <p className={`text-xl font-bold ${cardStyle.text}`}>
                    {stats.utilizationRate.toFixed(0)}%
                  </p>
                </div>
                <div className={`bg-white/10 ${charger.status !== 'available' && 'bg-gray-50'} rounded-xl p-3`}>
                  <div className="flex items-center gap-1 mb-1">
                    <Activity className={`h-3.5 w-3.5 ${cardStyle.text}`} />
                    <p className={`text-xs ${cardStyle.text} opacity-70`}>Sessões</p>
                  </div>
                  <p className={`text-xl font-bold ${cardStyle.text}`}>
                    {stats.sessionsCount}
                  </p>
                </div>
              </div>

              {/* Revenue & Energy */}
              <div className="grid grid-cols-2 gap-3">
                <div className={`bg-white/10 ${charger.status !== 'available' && 'bg-gray-50'} rounded-xl p-3`}>
                  <div className="flex items-center gap-1 mb-1">
                    <DollarSign className={`h-3.5 w-3.5 ${cardStyle.text}`} />
                    <p className={`text-xs ${cardStyle.text} opacity-70`}>Receita</p>
                  </div>
                  <p className={`text-lg font-bold ${cardStyle.text}`}>
                    R$ {stats.totalRevenue.toFixed(2)}
                  </p>
                </div>
                <div className={`bg-white/10 ${charger.status !== 'available' && 'bg-gray-50'} rounded-xl p-3`}>
                  <div className="flex items-center gap-1 mb-1">
                    <TrendingUp className={`h-3.5 w-3.5 ${cardStyle.text}`} />
                    <p className={`text-xs ${cardStyle.text} opacity-70`}>Energia</p>
                  </div>
                  <p className={`text-lg font-bold ${cardStyle.text}`}>
                    {stats.totalEnergy.toFixed(1)} kWh
                  </p>
                </div>
              </div>

              {/* Mini Charts */}
              <div className="space-y-2">
                <div className={`bg-white/10 ${charger.status !== 'available' && 'bg-gray-50'} rounded-xl p-3`}>
                  <p className={`text-xs ${cardStyle.text} opacity-70 mb-2`}>Sessões (7 dias)</p>
                  <ChargerMiniChart 
                    data={stats.dailyData} 
                    dataKey="sessions"
                    color={charger.status === 'available' ? '#ffffff' : '#bfd13b'}
                  />
                </div>
                <div className={`bg-white/10 ${charger.status !== 'available' && 'bg-gray-50'} rounded-xl p-3`}>
                  <p className={`text-xs ${cardStyle.text} opacity-70 mb-2`}>Receita (7 dias)</p>
                  <ChargerMiniChart 
                    data={stats.dailyData} 
                    dataKey="revenue"
                    color={charger.status === 'available' ? '#ffffff' : '#bfd13b'}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant={charger.status === 'available' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onEdit(charger)}
            className="flex-1 rounded-xl"
          >
            <Edit className="h-4 w-4 mr-1" />
            {t('common.edit')}
          </Button>
          <Button
            variant={charger.status === 'available' ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => onDelete(charger.id)}
            className="text-destructive hover:bg-destructive/10 rounded-xl"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
