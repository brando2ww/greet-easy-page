import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Zap, MapPin, Car, Plug } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function IniciarCarga() {
  const { t } = useTranslation();

  const header = (
    <div className="p-4">
      <h1 className="text-xl font-bold">{t('charging.title')}</h1>
    </div>
  );

  return (
    <ResponsiveLayout mobileHeader={header}>
      <div className="p-4 space-y-4">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
            <Zap className="w-12 h-12 text-primary" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Pronto para carregar?</h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Selecione uma estação e veículo para iniciar o carregamento
          </p>
          
          <Button size="lg" className="w-full max-w-xs h-14 text-lg">
            <Zap className="w-5 h-5 mr-2" />
            Começar Carregamento
          </Button>
        </div>

        <div className="space-y-3">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Selecionar Estação</p>
                <p className="text-sm text-muted-foreground">Escolha onde carregar</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Selecionar Veículo</p>
                <p className="text-sm text-muted-foreground">Escolha seu carro</p>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plug className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">Tipo de Plug</p>
                <p className="text-sm text-muted-foreground">Verifique compatibilidade</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
