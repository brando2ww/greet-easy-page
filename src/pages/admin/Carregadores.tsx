import { useTranslation } from 'react-i18next';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

const Carregadores = () => {
  const { t } = useTranslation();

  return (
    <ResponsiveLayout showBottomNav>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-purple-500/10">
        <div className="container mx-auto px-4 pt-6 pb-8 max-w-4xl">
          <h1 className="text-3xl font-bold text-foreground mb-6 animate-fade-in">
            {t('admin.chargers')}
          </h1>

          <Card className="mb-6 rounded-3xl border-primary/20 shadow-lg bg-gradient-to-br from-background via-background to-purple-500/5 backdrop-blur-sm animate-fade-in">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-primary h-4 w-4" />
                <Input
                  placeholder={t('admin.searchChargers')}
                  className="pl-10 rounded-2xl border-primary/30 focus:border-primary focus:ring-primary/20"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-primary/20 shadow-lg bg-gradient-to-br from-background via-background to-purple-500/5 backdrop-blur-sm animate-fade-in">
            <CardHeader>
              <CardTitle className="text-foreground">{t('admin.chargerList')}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{t('admin.noChargersFound')}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Carregadores;
