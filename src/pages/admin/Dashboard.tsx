import { useTranslation } from 'react-i18next';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { 
  Users, Zap, BarChart3, TrendingUp, TrendingDown, 
  Activity
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardChart } from '@/hooks/useDashboardChart';
import { useRecentActivities } from '@/hooks/useRecentActivities';

const Dashboard = () => {
  const { t } = useTranslation();
  const { data: statsData, isLoading: statsLoading } = useDashboardStats();
  const { data: chartData, isLoading: chartLoading } = useDashboardChart();
  const { data: recentActivities, isLoading: activitiesLoading } = useRecentActivities();

  const stats = [
    { 
      title: t('admin.totalUsers'), 
      value: statsData?.totalUsers.toString() || '0', 
      trend: `${statsData?.trends.users > 0 ? '+' : ''}${statsData?.trends.users.toFixed(1)}%`, 
      trendUp: (statsData?.trends.users || 0) >= 0, 
      icon: Users 
    },
    { 
      title: t('admin.activeChargers'), 
      value: statsData?.activeChargers.toString() || '0', 
      trend: `${statsData?.trends.chargers > 0 ? '+' : ''}${statsData?.trends.chargers.toFixed(1)}%`, 
      trendUp: (statsData?.trends.chargers || 0) >= 0, 
      icon: Zap 
    },
    { 
      title: t('admin.totalSessions'), 
      value: statsData?.totalSessions.toString() || '0', 
      trend: `${statsData?.trends.sessions > 0 ? '+' : ''}${statsData?.trends.sessions.toFixed(1)}%`, 
      trendUp: (statsData?.trends.sessions || 0) >= 0, 
      icon: BarChart3 
    },
    { 
      title: t('admin.revenue'), 
      value: `R$ ${statsData?.totalRevenue.toFixed(2) || '0.00'}`, 
      trend: `${statsData?.trends.revenue > 0 ? '+' : ''}${statsData?.trends.revenue.toFixed(1)}%`, 
      trendUp: (statsData?.trends.revenue || 0) >= 0, 
      icon: BarChart3 
    },
  ];

  const availabilityRate = statsData 
    ? ((statsData.activeChargers / (statsData.activeChargers + 3)) * 100).toFixed(1)
    : '0';

  if (statsLoading || chartLoading || activitiesLoading) {
    return (
      <ResponsiveLayout showBottomNav>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 animate-fade-in">
        <div className="container mx-auto px-4 pt-6 pb-8 space-y-6">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {t('admin.dashboard')}
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo ao painel administrativo
            </p>
          </div>

          {/* Unified Stats Card */}
          <Card className="border-2 border-green-200 shadow-lg animate-fade-in">
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;
                  return (
                    <div 
                      key={index} 
                      className={cn(
                        "flex flex-col items-center text-center",
                        index < 3 && "lg:border-r lg:border-green-200"
                      )}
                    >
                      <p className="text-sm text-muted-foreground mb-2">{stat.title}</p>
                      <Icon className="h-8 w-8 text-green-500 mb-3" />
                      <p className="text-4xl font-bold text-foreground mb-2">{stat.value}</p>
                      <div className="flex items-center gap-1">
                        <TrendIcon className={cn(
                          "h-4 w-4",
                          stat.trendUp ? "text-green-600" : "text-red-600"
                        )} />
                        <span className={cn(
                          "text-sm font-medium",
                          stat.trendUp ? "text-green-600" : "text-red-600"
                        )}>
                          {stat.trend}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Line Chart - 2/3 */}
            <Card className="lg:col-span-2 border-green-200 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg">Sessões de Carregamento</CardTitle>
                <p className="text-sm text-muted-foreground">Últimos 7 dias</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
                    <XAxis 
                      dataKey="date" 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#71717a"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '8px'
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="#86efac" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', r: 4 }}
                      name="Sessões"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="users" 
                      stroke="#d4d4d8" 
                      strokeWidth={2}
                      dot={{ fill: '#a1a1aa', r: 3 }}
                      name="Usuários"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Right Column - 1/3 */}
            <div className="space-y-6">
              {/* Pie Chart */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 via-lime-50 to-emerald-50 shadow-md">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Taxa de Disponibilidade</CardTitle>
                </CardHeader>
                <CardContent className="relative">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Available', value: parseFloat(availabilityRate) },
                          { name: 'Unavailable', value: 100 - parseFloat(availabilityRate) }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        <Cell fill="#86efac" />
                        <Cell fill="#e5e5e5" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <p className="text-4xl font-bold text-green-600">{availabilityRate}%</p>
                  </div>
                </CardContent>
              </Card>

              {/* Info Card */}
              <Card className="border-green-200 bg-gradient-to-br from-green-100 to-lime-100 shadow-md">
                <CardContent className="p-6">
                  <Zap className="h-8 w-8 text-green-600 mb-3" />
                  <h3 className="text-lg font-bold text-green-700 mb-2">
                    Carregamento Rápido
                  </h3>
                  <p className="text-sm text-green-600">
                    Otimize sua rede com nossos novos carregadores de 150kW
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Recent Activities */}
          <Card className="border-green-200 shadow-md">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-500" />
                  <CardTitle className="text-lg">Atividades Recentes</CardTitle>
                </div>
                <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                  Ver Todas
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {recentActivities && recentActivities.length > 0 ? (
                  recentActivities.map((activity, index) => {
                    const Icon = activity.icon;
                    return (
                      <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-green-50 transition-colors">
                        <div className="rounded-full bg-green-100 p-3 flex-shrink-0">
                          <Icon className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{activity.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{activity.description}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground mb-1">{activity.time}</p>
                          <Badge 
                            variant={activity.status === 'completed' ? 'default' : 'secondary'}
                            className={cn(
                              activity.status === 'completed' && "bg-green-100 text-green-700 hover:bg-green-200",
                              activity.status === 'active' && "bg-blue-100 text-blue-700"
                            )}
                          >
                            {activity.status === 'completed' ? 'Concluído' : 
                             activity.status === 'new' ? 'Novo' : 'Ativo'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-center text-muted-foreground py-8">Nenhuma atividade recente</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Dashboard;
