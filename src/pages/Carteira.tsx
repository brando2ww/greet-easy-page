import { ChevronRight, Plus, ChevronLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { WalletCardIcon } from "@/components/icons/WalletCardIcon";

const Carteira = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <ResponsiveLayout
      mobileHeader={
        <div className="flex items-center gap-3 p-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center justify-center"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold font-montserrat">Pagamento</h1>
        </div>
      }
      showBottomNav
      noBorder
    >
      <div className="space-y-8 p-4 -mt-4 md:p-6 md:mt-0">
        <div className="hidden md:block space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('wallet.title')}</h1>
          <p className="text-muted-foreground">{t('wallet.subtitle')}</p>
        </div>

        {/* Card de Saldo */}
        <Card className="p-6 -mt-12">
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
          <h3 className="text-lg font-semibold font-montserrat">{t('wallet.paymentMethods')}</h3>
          
          {/* Item: Saldo da carteira */}
          <div className="flex items-center gap-3 py-4 border-b">
            <div className="w-12 h-12 rounded-xl bg-accent flex items-center justify-center flex-shrink-0">
              <WalletCardIcon className="w-7 h-7" fill="hsl(var(--muted-foreground))" />
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
