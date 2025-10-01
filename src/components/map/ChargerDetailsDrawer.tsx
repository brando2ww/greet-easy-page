import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Zap, Navigation, MapPin, ChevronDown } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);

  if (!charger) return null;

  // Calculate distance if user location is available
  const calculateDistance = () => {
    if (!userLocation) return null;
    const [userLat, userLon] = userLocation;
    const R = 6371; // Earth's radius in km
    const dLat = (charger.latitude - userLat) * Math.PI / 180;
    const dLon = (charger.longitude - userLon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(userLat * Math.PI / 180) * Math.cos(charger.latitude * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance.toFixed(1);
  };

  const distance = calculateDistance();

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
          onClick={(e) => {
            // Toggle expansion when clicking anywhere except buttons
            if (!(e.target as HTMLElement).closest('button')) {
              setIsExpanded(!isExpanded);
            }
          }}
          className={cn(
            "fixed left-[50%] bottom-[126px] z-50 w-[calc(100%-2rem)] max-w-md translate-x-[-50%] border bg-background shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-[50px] data-[state=open]:slide-in-from-bottom-[50px] rounded-2xl pointer-events-auto transition-all cursor-pointer",
            isExpanded ? "h-auto max-h-[55vh] overflow-y-auto" : "h-auto"
          )}
        >
          {/* Handle bar with pulse animation */}
          <div className="flex justify-center pt-3 pb-1">
            <div className={cn(
              "w-12 h-1 rounded-full bg-muted-foreground/30 transition-all duration-300",
              !isExpanded && "animate-pulse"
            )} />
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 z-50"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="h-5 w-5" />
          </Button>

          <div className="px-6 pb-4">
            {/* Title */}
            <DialogPrimitive.Title className="text-lg font-bold mb-1 pr-10">
              {charger.name}
            </DialogPrimitive.Title>

            {/* Address */}
            <p className="text-sm text-muted-foreground mb-4">
              {charger.location}
            </p>

            {/* Collapsed view - Compact info */}
            <div className="flex items-center gap-4 mb-4">
              {/* Connector */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Plugs</p>
                  <p className="text-sm font-medium text-orange-600">
                    {charger.connector_type}
                  </p>
                </div>
              </div>

              {/* Power */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <Zap className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Potência</p>
                  <p className="text-sm font-medium">
                    {charger.power} kW
                  </p>
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="space-y-3 animate-fade-in">
                {/* Status Badge */}
                <div className="flex items-center gap-2 py-2">
                  <div className={`w-2 h-2 rounded-full ${statusColor}`} />
                  <span className="text-sm capitalize">
                    {charger.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Distance */}
                {distance && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <MapPin className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Distância</p>
                      <p className="text-sm font-medium">{distance} km</p>
                    </div>
                  </div>
                )}

                {/* Price */}
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
            )}

            {/* Navigate Button - Always visible */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
              className="w-full mt-4"
              size="lg"
            >
              <Navigation className="h-5 w-5 mr-2" />
              Traçar rota
            </Button>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
};
