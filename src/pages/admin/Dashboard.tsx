import { useTranslation } from 'react-i18next';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Zap, BarChart3, TrendingUp } from 'lucide-react';

const Dashboard = () => {
  const { t } = useTranslation();

  const stats = [
    {
      title: t('admin.totalUsers'),
      value: '1,234',
      icon: Users,
      trend: '+12%',
      trendUp: true
    },
    {
      title: t('admin.activeChargers'),
      value: '89',
      icon: Zap,
      trend: '+5%',
      trendUp: true
    },
    {
      title: t('admin.totalSessions'),
      value: '5,678',
      icon: BarChart3,
      trend: '+23%',
      trendUp: true
    },
    {
      title: t('admin.revenue'),
      value: 'R$ 45,678',
      icon: TrendingUp,
      trend: '+18%',
      trendUp: true
    }
  ];

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
        <div className="container mx-auto px-4 pt-6 pb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {t('admin.dashboard')}
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className={`text-xs ${stat.trendUp ? 'text-green-600' : 'text-red-600'} flex items-center mt-1`}>
                      {stat.trend} {t('admin.fromLastMonth')}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{t('admin.recentActivity')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('admin.noRecentActivity')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Dashboard;
