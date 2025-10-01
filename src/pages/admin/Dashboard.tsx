import { useTranslation } from 'react-i18next';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Zap, BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const Dashboard = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('admin.totalUsers'),
      value: '1,234',
      icon: Users,
      trend: '+12%',
      trendUp: true,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-500/10',
      textColor: 'text-blue-600 dark:text-blue-400'
    },
    {
      title: t('admin.activeChargers'),
      value: '89',
      icon: Zap,
      trend: '+5%',
      trendUp: true,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-500/10',
      textColor: 'text-green-600 dark:text-green-400'
    },
    {
      title: t('admin.totalSessions'),
      value: '5,678',
      icon: BarChart3,
      trend: '+23%',
      trendUp: true,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-500/10',
      textColor: 'text-purple-600 dark:text-purple-400'
    },
    {
      title: t('admin.revenue'),
      value: 'R$ 45,678',
      icon: TrendingUp,
      trend: '+18%',
      trendUp: true,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-500/10',
      textColor: 'text-orange-600 dark:text-orange-400'
    }
  ];

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 animate-fade-in">
        <div className="container mx-auto px-4 pt-6 pb-8 space-y-8">
          {/* Header Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-foreground">
              {t('admin.dashboard')}
            </h1>
            <p className="text-muted-foreground">
              Bem-vindo ao painel administrativo
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const TrendIcon = stat.trendUp ? TrendingUp : TrendingDown;
              return (
                <Card 
                  key={index}
                  className={cn(
                    "group hover:shadow-lg transition-all duration-300 hover:scale-[1.02] cursor-pointer border-l-4",
                    stat.trendUp ? "border-l-green-500" : "border-l-red-500"
                  )}
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animationFillMode: 'backwards'
                  }}
                >
                  <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={cn(
                      "rounded-lg p-2.5 transition-transform duration-300 group-hover:scale-110",
                      stat.bgColor
                    )}>
                      <Icon className={cn("h-5 w-5", stat.textColor)} strokeWidth={2} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold text-foreground">
                      {stat.value}
                    </div>
                    <div className="flex items-center gap-1">
                      <TrendIcon className={cn(
                        "h-3.5 w-3.5",
                        stat.trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )} />
                      <span className={cn(
                        "text-xs font-medium",
                        stat.trendUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                      )}>
                        {stat.trend}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {t('admin.fromLastMonth')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Recent Activity Card */}
          <Card className="min-h-[300px] hover:shadow-md transition-shadow duration-300">
            <CardHeader className="border-b bg-muted/30">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-lg">{t('admin.recentActivity')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                <div className="rounded-full bg-muted p-6">
                  <Activity className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-center space-y-2">
                  <p className="text-base font-medium text-foreground">
                    {t('admin.noRecentActivity')}
                  </p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Quando houver atividade no sistema, ela aparecerá aqui
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Dashboard;
