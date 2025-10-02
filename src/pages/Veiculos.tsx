import { useState, useEffect } from "react";
import { ResponsiveLayout } from "@/components/ResponsiveLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Battery, Plug, Droplet, Zap, Trash2, Leaf, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "@/hooks/use-toast";
import { CarIcon } from "@/components/icons/CarIcon";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate?: string;
  color: string;
  plugType: string;
  batteryCapacity: number;
  chassi?: string;
  autonomy?: number;
  type: 'hybrid' | 'electric';
}

export default function Veiculos() {
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isTypeDialogOpen, setIsTypeDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'hybrid' | 'electric' | null>(null);
  const [vehicleToDelete, setVehicleToDelete] = useState<string | null>(null);

  const vehicleSchema = z.object({
    brand: z.string().min(1, { message: t('vehicles.brandRequired') }),
    model: z.string().min(1, { message: t('vehicles.modelRequired') }),
    year: z.number().min(2015).max(2025, { message: t('vehicles.yearRequired') }),
    plate: z.string().optional(),
    color: z.string().min(1, { message: t('vehicles.colorRequired') }),
    plugType: z.string().min(1, { message: t('vehicles.plugTypeRequired') }),
    batteryCapacity: z.number()
      .min(10, { message: t('vehicles.batteryCapacityMin') })
      .max(200, { message: t('vehicles.batteryCapacityMax') }),
    chassi: z.string().optional(),
    autonomy: z.number().min(1).optional(),
  });

  type VehicleFormData = z.infer<typeof vehicleSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<VehicleFormData>({
    resolver: zodResolver(vehicleSchema),
  });

  const handleVehicleTypeSelect = (type: 'hybrid' | 'electric') => {
    setSelectedType(type);
    setIsTypeDialogOpen(false);
    
    // Auto scroll to form
    setTimeout(() => {
      const formElement = document.getElementById('vehicle-form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const onSubmit = (data: VehicleFormData) => {
    if (!selectedType) return;

    const newVehicle: Vehicle = {
      id: Date.now().toString(),
      brand: data.brand,
      model: data.model,
      year: data.year,
      plate: data.plate,
      color: data.color,
      plugType: data.plugType,
      batteryCapacity: data.batteryCapacity,
      chassi: data.chassi,
      autonomy: data.autonomy,
      type: selectedType,
    };

    setVehicles([...vehicles, newVehicle]);
    reset();
    setSelectedType(null);
    
    toast({
      title: t('common.success'),
      description: t('vehicles.vehicleAdded'),
    });
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
    setVehicleToDelete(null);
    toast({
      title: t('common.success'),
      description: t('vehicles.vehicleDeleted'),
    });
  };

  const handleFormCancel = () => {
    reset();
    setSelectedType(null);
  };

  const VehicleTypeCards = () => (
    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
      <Card 
        className={`cursor-pointer border-2 transition-all duration-200 hover:scale-105 ${
          selectedType === 'hybrid' ? 'border-primary border-3 shadow-lg' : 'hover:border-primary hover:shadow-lg'
        }`}
        onClick={() => handleVehicleTypeSelect('hybrid')}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative inline-block">
            <CarIcon className="w-20 h-20 text-foreground" />
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <div className="p-1 rounded-md" style={{ backgroundColor: 'rgba(255, 140, 66, 0.2)' }}>
                <Droplet className="w-3 h-3" style={{ color: '#FF8C42' }} />
              </div>
              <div className="p-1 rounded-md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                <Leaf className="w-3 h-3" style={{ color: '#22C55E' }} />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-center">
            {t('vehicles.hybrid')}
          </h3>
        </CardContent>
      </Card>

      <Card 
        className={`cursor-pointer border-2 transition-all duration-200 hover:scale-105 ${
          selectedType === 'electric' ? 'border-primary border-3 shadow-lg' : 'hover:border-primary hover:shadow-lg'
        }`}
        onClick={() => handleVehicleTypeSelect('electric')}
      >
        <CardContent className="p-6 flex flex-col items-center justify-center space-y-4">
          <div className="relative inline-block">
            <CarIcon className="w-20 h-20 text-foreground" />
            <div className="absolute -bottom-1 -right-1 flex gap-1">
              <div className="p-1 rounded-md" style={{ backgroundColor: 'rgba(34, 197, 94, 0.2)' }}>
                <Zap className="w-3 h-3" style={{ color: '#22C55E' }} />
              </div>
            </div>
          </div>
          <h3 className="text-lg font-semibold text-center">
            {t('vehicles.electric')}
          </h3>
        </CardContent>
      </Card>
    </div>
  );

  // Inline form component
  const InlineForm = () => (
    <div 
      id="vehicle-form"
      className="max-w-2xl mx-auto animate-fade-in"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <Label htmlFor="brand">Marca do veículo</Label>
          <Input id="brand" {...register('brand')} placeholder="Tesla, BYD, Nissan..." />
          {errors.brand && <p className="text-sm text-destructive mt-1">{errors.brand.message}</p>}
        </div>

        <div>
          <Label htmlFor="model">Modelo do veículo</Label>
          <Input id="model" {...register('model')} placeholder="Model 3, Dolphin, Leaf..." />
          {errors.model && <p className="text-sm text-destructive mt-1">{errors.model.message}</p>}
        </div>

        <div>
          <Label htmlFor="plugType">Plugs ou adaptadores</Label>
          <Select onValueChange={(value) => setValue('plugType', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecionar ⊕" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="type2">{t('vehicles.plugTypes.type2')}</SelectItem>
              <SelectItem value="chademo">{t('vehicles.plugTypes.chademo')}</SelectItem>
              <SelectItem value="ccs2">{t('vehicles.plugTypes.ccs2')}</SelectItem>
              <SelectItem value="tesla">{t('vehicles.plugTypes.tesla')}</SelectItem>
            </SelectContent>
          </Select>
          {errors.plugType && <p className="text-sm text-destructive mt-1">{errors.plugType.message}</p>}
        </div>

        <div>
          <div className="flex items-center gap-2 mb-2">
            <Label htmlFor="plate">Placa (opcional)</Label>
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <Input 
            id="plate" 
            {...register('plate')} 
            placeholder="ABC-1234" 
            maxLength={8}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              e.target.value = value;
              setValue('plate', value);
            }}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Ao incluir sua placa você terá ofertas exclusivas através da mesma
          </p>
          {errors.plate && <p className="text-sm text-destructive mt-1">{errors.plate.message}</p>}
        </div>

        <div>
          <Label htmlFor="chassi">Chassi do veículo</Label>
          <Input id="chassi" {...register('chassi')} placeholder="Digite o chassi" />
          <p className="text-xs text-muted-foreground mt-1">
            Para receber benefícios exclusivos dos parceiros Tupi
          </p>
          {errors.chassi && <p className="text-sm text-destructive mt-1">{errors.chassi.message}</p>}
        </div>

        <div>
          <Label htmlFor="batteryCapacity">Capacidade da bateria em kWh</Label>
          <Input 
            id="batteryCapacity" 
            type="number" 
            {...register('batteryCapacity', { valueAsNumber: true })} 
            placeholder="75" 
          />
          {errors.batteryCapacity && <p className="text-sm text-destructive mt-1">{errors.batteryCapacity.message}</p>}
        </div>

        <div>
          <Label htmlFor="autonomy">Autonomia em km</Label>
          <Input 
            id="autonomy" 
            type="number" 
            {...register('autonomy', { valueAsNumber: true })}
            placeholder="Informe a autonomia em km"
          />
          {errors.autonomy && <p className="text-sm text-destructive mt-1">{errors.autonomy.message}</p>}
        </div>

        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" className="flex-1" onClick={handleFormCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            Adicionar veículo
          </Button>
        </div>
      </form>
    </div>
  );

  // Empty state - show cards directly
  if (vehicles.length === 0) {
    return (
      <ResponsiveLayout showBottomNav>
        <div className="p-4 space-y-6 pb-16">
          <div>
            <h1 className="text-xl font-bold">{t('vehicles.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {t('vehicles.selectType')}
            </p>
          </div>
          
          <VehicleTypeCards />

          {/* Inline Form */}
          {selectedType && <InlineForm />}
        </div>
      </ResponsiveLayout>
    );
  }

  // List state - show vehicles with + button
  const header = (
    <div className="p-4 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold">{t('vehicles.title')}</h1>
        <p className="text-sm text-muted-foreground">
          {vehicles.length} {vehicles.length === 1 ? t('vehicles.vehicleRegistered') : t('vehicles.vehiclesRegistered')}
        </p>
      </div>
      <Button size="icon" className="rounded-full w-12 h-12" onClick={() => setIsTypeDialogOpen(true)}>
        <Plus className="w-6 h-6" />
      </Button>
    </div>
  );

  return (
    <ResponsiveLayout mobileHeader={header} showBottomNav>
      <div className="p-4 space-y-4">
        {vehicles.map((vehicle) => (
          <Card key={vehicle.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CarIcon className="w-10 h-10 text-primary" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{vehicle.brand} {vehicle.model}</h3>
                      <p className="text-sm text-muted-foreground">{vehicle.plate} • {vehicle.year}</p>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setVehicleToDelete(vehicle.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {vehicle.type === 'hybrid' ? (
                        <div className="flex items-center gap-1">
                          <Droplet className="w-3 h-3" />
                          <Zap className="w-3 h-3" />
                          {t('vehicles.hybrid')}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {t('vehicles.electric')}
                        </div>
                      )}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Plug className="w-3 h-3 mr-1" />
                      {t(`vehicles.plugTypes.${vehicle.plugType}`)}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      <Battery className="w-3 h-3 mr-1" />
                      {vehicle.batteryCapacity} kWh
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Type Selection Dialog */}
      <Dialog open={isTypeDialogOpen} onOpenChange={setIsTypeDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {t('vehicles.addNew')}
            </DialogTitle>
            <p className="text-center text-muted-foreground mt-2">
              {t('vehicles.selectType')}
            </p>
          </DialogHeader>

          <div className="mt-6">
            <VehicleTypeCards />
          </div>

          {/* Inline Form in Dialog */}
          {selectedType && (
            <div className="mt-6">
              <InlineForm />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!vehicleToDelete} onOpenChange={() => setVehicleToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('vehicles.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('vehicles.deleteDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => vehicleToDelete && handleDeleteVehicle(vehicleToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </ResponsiveLayout>
  );
}
