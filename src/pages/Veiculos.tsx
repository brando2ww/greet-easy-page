import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Car, Battery, Plug } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  const header = (
    <div className="p-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">{t('vehicles.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {vehicles.length} {vehicles.length === 1 ? 'veículo' : 'veículos'} cadastrados
        </p>
      </div>
      <Button size="icon" className="rounded-full w-12 h-12">
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
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Veículo
            </Button>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}
