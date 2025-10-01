import { ChevronRight, Plus, ChevronLeft, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { WalletCardIcon } from "@/components/icons/WalletCardIcon";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { useState } from "react";

const Carteira = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const paymentOptions = [
    { key: 'pix', label: t('wallet.pix') },
    { key: 'creditCard', label: t('wallet.creditCard') },
    { key: 'ticketCar', label: t('wallet.ticketCar') },
    { key: 'semParar', label: t('wallet.semParar') },
    { key: 'flexFrota', label: t('wallet.flexFrota') },
  ];

  const handleSelectPayment = (option: string) => {
    console.log('Selected payment method:', option);
    setOpen(false);
  };

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
            <div className="w-12 h-12 rounded-xl bg-green-500 flex items-center justify-center flex-shrink-0">
              <WalletCardIcon className="w-7 h-7" fill="white" />
            </div>
            <span className="text-sm font-medium">{t('wallet.walletBalance')}</span>
          </div>

          {/* Botão Adicionar */}
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full border-green-500 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 dark:text-green-400 dark:border-green-600 dark:hover:bg-green-600 dark:hover:text-white transition-all"
              >
                <Plus className="w-4 h-4" />
                {t('wallet.addPaymentMethod')}
              </Button>
            </DrawerTrigger>
            <DrawerContent className="z-50">
              <DrawerHeader className="relative border-b pb-4">
                <DrawerTitle className="text-center font-montserrat">
                  {t('wallet.choosePaymentMethod')}
                </DrawerTitle>
                <DrawerClose className="absolute right-4 top-4">
                  <X className="h-5 w-5" />
                </DrawerClose>
              </DrawerHeader>
              <div className="p-4">
                {paymentOptions.map((option, index) => (
                  <button
                    key={option.key}
                    onClick={() => handleSelectPayment(option.key)}
                    className={`w-full flex items-center justify-between py-4 text-left hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${
                      index < paymentOptions.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Carteira;
