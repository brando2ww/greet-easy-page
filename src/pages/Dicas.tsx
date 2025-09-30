import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Battery, Zap, DollarSign, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function Dicas() {
  const { t } = useTranslation();

  const tips = [
    {
      id: 1,
      icon: Battery,
      title: "Economize bateria",
      description: "Dicas para maximizar a autonomia do seu veículo elétrico",
      color: "bg-green-500"
    },
    {
      id: 2,
      icon: Zap,
      title: "Carga rápida",
      description: "Quando e como usar estações de carga rápida",
      color: "bg-blue-500"
    },
    {
      id: 3,
      icon: DollarSign,
      title: "Economize dinheiro",
      description: "Melhores horários e tarifas para carregar",
      color: "bg-yellow-500"
    },
    {
      id: 4,
      icon: Clock,
      title: "Planeje sua viagem",
      description: "Como organizar paradas de recarga em viagens longas",
      color: "bg-purple-500"
    }
  ];
  const header = (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('tips.title')}</h1>
      <p className="text-sm text-muted-foreground">
        {t('tips.subtitle')}
      </p>
    </div>
  );

  return (
    <ResponsiveLayout mobileHeader={header} showBottomNav>
      <div className="p-4 space-y-4">
        {tips.map((tip) => {
          const Icon = tip.icon;
          return (
            <Card key={tip.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className={`${tip.color} p-3 rounded-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{tip.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {tip.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </ResponsiveLayout>
  );
}
