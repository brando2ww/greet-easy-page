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

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPrimitive.Portal>
        <div className="fixed inset-0 z-40 pointer-events-none" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-[50%] bottom-[126px] z-50 w-[calc(100%-2rem)] max-w-md translate-x-[-50%] border bg-background shadow-xl duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-bottom-[50px] data-[state=open]:slide-in-from-bottom-[50px] rounded-2xl pointer-events-auto"
          )}
        >
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

          <div className="px-6 py-6">
            {/* Title */}
            <DialogPrimitive.Title className="text-lg font-bold mb-1 pr-10">
              {charger.name}
            </DialogPrimitive.Title>

            {/* Address */}
            <p className="text-sm text-muted-foreground mb-6">
              {charger.location}
            </p>

            {/* Navigate Button */}
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleNavigate();
              }}
              className="w-full"
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
