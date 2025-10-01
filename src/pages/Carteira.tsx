import { Wallet, ChevronRight, Plus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useTranslation } from "react-i18next";

const Carteira = () => {
  const { t } = useTranslation();

  return (
    <ResponsiveLayout
      mobileHeader={
        <div className="space-y-1 p-4">
          <h1 className="text-2xl font-bold tracking-tight">{t('wallet.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('wallet.subtitle')}</p>
        </div>
      }
      showBottomNav
    >
      <div className="space-y-8 p-4 md:p-6">
        <div className="hidden md:block space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('wallet.title')}</h1>
          <p className="text-muted-foreground">{t('wallet.subtitle')}</p>
        </div>

        {/* Card de Saldo */}
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">{t('wallet.balanceTitle')}</p>
              <h2 className="text-4xl font-bold mt-2 mb-4">R$ 0,00</h2>
              <Button className="bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700 text-white">
                <Plus className="w-4 h-4" />
                {t('wallet.addBalance')}
              </Button>
            </div>
            <ChevronRight className="w-6 h-6 text-muted-foreground" />
          </div>
        </Card>

        {/* Formas de Pagamento */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">{t('wallet.paymentMethods')}</h3>
          
          {/* Item: Saldo da carteira */}
          <div className="flex items-center gap-3 py-4 border-b">
            <div className="p-2 rounded-lg bg-accent">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <span className="text-sm font-medium">{t('wallet.walletBalance')}</span>
          </div>

          {/* Botão Adicionar */}
          <Button 
            variant="outline" 
            className="w-full border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-950 dark:text-green-400 dark:border-green-600"
          >
            <Plus className="w-4 h-4" />
            {t('wallet.addPaymentMethod')}
          </Button>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Carteira;
