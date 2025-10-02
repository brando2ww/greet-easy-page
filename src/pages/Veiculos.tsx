import { useState } from "react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Car, Battery, Plug, Droplet, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { CarIcon } from "@/components/icons/CarIcon";

const vehicles = [
  {
    id: 1,
    model: "Tesla Model 3",
    plate: "ABC-1234",
    plugType: "Tipo 2",
    battery: "75 kWh",
    image: "🚗"
  },
  {
    id: 2,
    model: "Nissan Leaf",
    plate: "XYZ-5678",
    plugType: "CHAdeMO",
    battery: "40 kWh",
    image: "🚙"
  }
];

export default function Veiculos() {
  const { t } = useTranslation();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleVehicleTypeSelect = (type: 'hybrid' | 'electric') => {
    setIsDialogOpen(false);
    toast({
      title: t('vehicles.typeSelected'),
      description: type === 'hybrid' ? t('vehicles.hybrid') : t('vehicles.electric'),
    });
  };

  const header = (
    <div className="p-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">{t('vehicles.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {vehicles.length} {vehicles.length === 1 ? 'veículo' : 'veículos'} cadastrados
        </p>
      </div>
      <Button size="icon" className="rounded-full w-12 h-12" onClick={() => setIsDialogOpen(true)}>
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );

  return (
    <ResponsiveLayout mobileHeader={header} showBottomNav>
      <div className="p-4 space-y-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-3xl">
                  {vehicle.image}
                </div>
                <div className="flex-1 space-y-2">
                  <div>
                    <h3 className="font-bold text-lg">{vehicle.model}</h3>
                    <p className="text-sm text-muted-foreground">{vehicle.plate}</p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Plug className="w-3 h-3 mr-1" />
                      {vehicle.plugType}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Battery className="w-3 h-3 mr-1" />
                      {vehicle.battery}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {vehicles.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Car className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Nenhum veículo cadastrado</h3>
            <p className="text-sm text-muted-foreground mb-6">
              Adicione seu primeiro veículo elétrico
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Veículo
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {t('vehicles.addNew')}
            </DialogTitle>
            <p className="text-center text-muted-foreground mt-2">
              {t('vehicles.selectType')}
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {/* Híbrido Card */}
            <Card 
              className="cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleVehicleTypeSelect('hybrid')}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <CarIcon className="w-20 h-20 text-foreground" strokeWidth={1.5} />
                  <div className="absolute -bottom-2 -right-2 bg-orange-500 rounded-full p-2">
                    <Droplet className="w-6 h-6 text-white" fill="currentColor" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center">
                  {t('vehicles.hybrid')}
                </h3>
              </CardContent>
            </Card>

            {/* 100% Elétrico Card */}
            <Card 
              className="cursor-pointer border-2 hover:border-primary hover:shadow-lg transition-all duration-200 hover:scale-105"
              onClick={() => handleVehicleTypeSelect('electric')}
            >
              <CardContent className="p-8 flex flex-col items-center justify-center space-y-4">
                <div className="relative">
                  <CarIcon className="w-20 h-20 text-foreground" strokeWidth={1.5} />
                  <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                    <Zap className="w-6 h-6 text-white" fill="currentColor" />
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-center">
                  {t('vehicles.electric')}
                </h3>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    </ResponsiveLayout>
  );
}
