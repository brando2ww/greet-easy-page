import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
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

export const ChargerDetailsDrawer = ({
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
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="z-[100]">
        <DrawerHeader className="relative pb-2">
          <DrawerClose asChild>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={onClose}
            >
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
          <DrawerTitle className="text-xl font-semibold text-left pr-10">
            {charger.name}
          </DrawerTitle>
        </DrawerHeader>

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
      </DrawerContent>
    </Drawer>
  );
};
