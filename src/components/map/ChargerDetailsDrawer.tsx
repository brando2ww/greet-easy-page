import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { Badge } from '@/components/ui/badge';

interface Charger {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
  status: string;
  power: number;
  price_per_kwh: number;
  connector_type: string;
}

interface ChargerDetailsDrawerProps {
  charger: Charger | null;
  isOpen: boolean;
  onClose: () => void;
  userLocation?: [number, number] | null;
}

export const ChargerDetailsModal = ({
  charger,
  isOpen,
  onClose,
  userLocation,
}: ChargerDetailsDrawerProps) => {
  const { t } = useTranslation();

  if (!charger) return null;

  const handleNavigate = () => {
    const destination = `${charger.latitude},${charger.longitude}`;
    const origin = userLocation
      ? `${userLocation[1]},${userLocation[0]}`
      : '';
    
    // Open Google Maps with directions
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    window.open(mapsUrl, '_blank');
  };

  const statusColor = 
    charger.status === 'available' ? 'bg-green-500' :
    charger.status === 'in_use' ? 'bg-red-500' :
    'bg-gray-500';

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <div className="fixed inset-0 z-40 pointer-events-none" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] bottom-[106px] z-50 grid w-[calc(100%-2rem)] max-w-md translate-x-[-50%] gap-4 border bg-background p-6 shadow-xl duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-[50px] data-[state=open]:slide-in-from-bottom-[50px] max-h-[55vh] overflow-y-auto rounded-2xl pointer-events-auto"
          )}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
          <div className="flex flex-col space-y-1.5 text-left pb-2">
            <DialogPrimitive.Title className="text-xl font-semibold text-left pr-10">
              {charger.name}
            </DialogPrimitive.Title>
          </div>

        <div className="px-4 pb-6 space-y-4">
          {/* Address */}
          <p className="text-sm text-muted-foreground">
            {charger.location}
          </p>

          {/* Status Badge */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${statusColor}`} />
            <span className="text-sm capitalize">
              {charger.status.replace('_', ' ')}
            </span>
          </div>

          {/* Details Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                <Zap className="h-4 w-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('stations.connector')}
                </p>
                <p className="text-sm font-medium text-orange-600">
                  {charger.connector_type}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('stations.powerKw')}
                </p>
                <p className="text-sm font-medium">
                  {charger.power} kW
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-green-600">R$</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  {t('stations.pricePerKwh')}
                </p>
                <p className="text-sm font-medium">
                  R$ {charger.price_per_kwh.toFixed(2)}/kWh
                </p>
              </div>
            </div>
          </div>

          {/* Navigate Button */}
          <Button
            onClick={handleNavigate}
            className="w-full mt-4"
            size="lg"
          >
            <Navigation className="h-5 w-5 mr-2" />
            Traçar rota
          </Button>

          {/* Start Charging Button (only if available) */}
          {charger.status === 'available' && (
            <Button
              onClick={() => window.location.href = `/iniciar-carga?charger=${charger.id}`}
              variant="outline"
              className="w-full"
              size="lg"
            >
              {t('stations.startCharging')}
            </Button>
          )}
        </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
