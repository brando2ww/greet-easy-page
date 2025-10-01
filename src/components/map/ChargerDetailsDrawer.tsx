import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto rounded-2xl">
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-4 z-50"
          onClick={onClose}
        >
          <X className="h-5 w-5" />
        </Button>
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-semibold text-left pr-10">
            {charger.name}
          </DialogTitle>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
};
