import { useTranslation } from 'react-i18next';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Relatorios = () => {
  const { t } = useTranslation();

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 pb-20">
        <div className="container mx-auto px-4 pt-6 pb-8">
          <h1 className="text-3xl font-bold text-foreground mb-6">
            {t('admin.reports')}
          </h1>

          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">{t('admin.overview')}</TabsTrigger>
              <TabsTrigger value="usage">{t('admin.usage')}</TabsTrigger>
              <TabsTrigger value="revenue">{t('admin.revenueReport')}</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.overviewReport')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('admin.noDataAvailable')}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="usage">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.usageReport')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('admin.noDataAvailable')}</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="revenue">
              <Card>
                <CardHeader>
                  <CardTitle>{t('admin.revenueReport')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t('admin.noDataAvailable')}</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Relatorios;
