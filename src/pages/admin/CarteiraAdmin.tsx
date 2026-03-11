import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveLayout } from '@/components/ResponsiveLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DollarSign, TrendingUp, Receipt, CreditCard, Trash2, CheckCircle, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { transactionsApi } from '@/services/api';

interface AdminWalletData {
  totalRevenue: number;
  monthRevenue: number;
  totalBilledSessions: number;
  recentBilled: {
    id: string;
    startedAt: string;
    endedAt: string | null;
    cost: number;
    energyConsumed: number | null;
    chargerName: string;
    chargerLocation: string;
  }[];
  paymentConfig: {
    id: string;
    provider: string;
    account_id: string | null;
    account_email: string | null;
    is_active: boolean;
  }[];
}

const CarteiraAdmin = () => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [stripeEmail, setStripeEmail] = useState('');
  const [mpEmail, setMpEmail] = useState('');

  const { data, isLoading } = useQuery<AdminWalletData>({
    queryKey: ['admin-wallet'],
    queryFn: async () => {
      const res = await transactionsApi.adminWallet();
      if (res.error) throw new Error(res.error);
      return res.data!;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({ provider, account_email }: { provider: string; account_email: string }) => {
      const res = await transactionsApi.savePaymentConfig({ provider, account_email });
      if (res.error) throw new Error(res.error);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallet'] });
      toast.success(t('adminWallet.configSaved'));
      setStripeEmail('');
      setMpEmail('');
    },
    onError: () => toast.error(t('common.error')),
  });

  const deleteMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await transactionsApi.deletePaymentConfig(provider);
      if (res.error) throw new Error(res.error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-wallet'] });
      toast.success(t('adminWallet.configRemoved'));
    },
    onError: () => toast.error(t('common.error')),
  });

  const stripeConfig = data?.paymentConfig?.find(c => c.provider === 'stripe');
  const mpConfig = data?.paymentConfig?.find(c => c.provider === 'mercado_pago');

  const formatCurrency = (val: number) => `R$ ${val.toFixed(2).replace('.', ',')}`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <ResponsiveLayout showBottomNav>
      <div className="p-4 md:p-6 space-y-6 pb-28">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('adminWallet.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('adminWallet.subtitle')}</p>
        </div>

        {/* Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-50">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('adminWallet.totalRevenue')}</p>
                  {isLoading ? <Skeleton className="h-6 w-24" /> : (
                    <p className="text-xl font-bold text-foreground">{formatCurrency(data?.totalRevenue || 0)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-50">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('adminWallet.monthRevenue')}</p>
                  {isLoading ? <Skeleton className="h-6 w-24" /> : (
                    <p className="text-xl font-bold text-foreground">{formatCurrency(data?.monthRevenue || 0)}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-50">
                  <Receipt className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('adminWallet.billedSessions')}</p>
                  {isLoading ? <Skeleton className="h-6 w-24" /> : (
                    <p className="text-xl font-bold text-foreground">{data?.totalBilledSessions || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              {t('adminWallet.paymentMethods')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Stripe */}
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Stripe</span>
                  {stripeConfig ? (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" /> {t('adminWallet.linked')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <AlertCircle className="w-3 h-3 mr-1" /> {t('adminWallet.notLinked')}
                    </Badge>
                  )}
                </div>
                {stripeConfig && (
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate('stripe')}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              {stripeConfig ? (
                <p className="text-sm text-muted-foreground">{stripeConfig.account_email}</p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={t('adminWallet.emailPlaceholder')}
                    value={stripeEmail}
                    onChange={e => setStripeEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!stripeEmail || saveMutation.isPending}
                    onClick={() => saveMutation.mutate({ provider: 'stripe', account_email: stripeEmail })}
                  >
                    {t('adminWallet.link')}
                  </Button>
                </div>
              )}
            </div>

            {/* Mercado Pago */}
            <div className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">Mercado Pago</span>
                  {mpConfig ? (
                    <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                      <CheckCircle className="w-3 h-3 mr-1" /> {t('adminWallet.linked')}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      <AlertCircle className="w-3 h-3 mr-1" /> {t('adminWallet.notLinked')}
                    </Badge>
                  )}
                </div>
                {mpConfig && (
                  <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate('mercado_pago')}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                )}
              </div>
              {mpConfig ? (
                <p className="text-sm text-muted-foreground">{mpConfig.account_email}</p>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder={t('adminWallet.emailPlaceholder')}
                    value={mpEmail}
                    onChange={e => setMpEmail(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={!mpEmail || saveMutation.isPending}
                    onClick={() => saveMutation.mutate({ provider: 'mercado_pago', account_email: mpEmail })}
                  >
                    {t('adminWallet.link')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('adminWallet.billingHistory')}</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : !data?.recentBilled?.length ? (
              <p className="text-sm text-muted-foreground text-center py-6">{t('adminWallet.noSessions')}</p>
            ) : (
              <div className="space-y-2">
                {data.recentBilled.map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{s.chargerName}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(s.startedAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-green-600">{formatCurrency(Number(s.cost))}</p>
                      {s.energyConsumed && (
                        <p className="text-xs text-muted-foreground">{Number(s.energyConsumed).toFixed(2)} kWh</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveLayout>
  );
};

export default CarteiraAdmin;
