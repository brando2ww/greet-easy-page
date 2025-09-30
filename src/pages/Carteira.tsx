import { Wallet, CreditCard, History, Gift } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { useTranslation } from "react-i18next";

const Carteira = () => {
  const { t } = useTranslation();

  const walletSections = [
    {
      id: 1,
      icon: Wallet,
      title: "Saldo Disponível",
      description: "R$ 150,00 em créditos",
      color: "text-primary"
    },
    {
      id: 2,
      icon: CreditCard,
      title: "Métodos de Pagamento",
      description: "Gerencie seus cartões e formas de pagamento",
      color: "text-blue-500"
    },
    {
      id: 3,
      icon: History,
      title: "Histórico de Transações",
      description: "Veja todas as suas transações e recargas",
      color: "text-green-500"
    },
    {
      id: 4,
      icon: Gift,
      title: "Cupons e Promoções",
      description: "Resgate cupons e aproveite descontos",
      color: "text-purple-500"
    }
  ];

  return (
    <ResponsiveLayout
      mobileHeader={
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">{t('wallet.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('wallet.subtitle')}</p>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="hidden md:block space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('wallet.title')}</h1>
          <p className="text-muted-foreground">{t('wallet.subtitle')}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {walletSections.map((section) => {
            const Icon = section.icon;
            return (
              <Card key={section.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg bg-accent ${section.color}`}>
                      <Icon className="w-6 h-6" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{section.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {section.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </ResponsiveLayout>
  );
};

export default Carteira;
