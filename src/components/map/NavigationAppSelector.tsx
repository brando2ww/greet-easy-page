import React, { useState } from 'react';
import { Route, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerOverlay,
} from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface NavigationAppSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  latitude: number;
  longitude: number;
  userLocation?: [number, number] | null;
}

type NavigationApp = 'waze' | 'google' | 'apple';

const navigationApps = [
  {
    id: 'waze' as NavigationApp,
    name: 'Waze',
    icon: '🗺️',
    color: 'bg-blue-50 hover:bg-blue-100',
  },
  {
    id: 'google' as NavigationApp,
    name: 'Google Maps',
    icon: '🗺',
    color: 'bg-green-50 hover:bg-green-100',
  },
  {
    id: 'apple' as NavigationApp,
    name: 'Apple Maps',
    icon: '🧭',
    color: 'bg-gray-50 hover:bg-gray-100',
  },
];

export const NavigationAppSelector = ({
  isOpen,
  onClose,
  latitude,
  longitude,
  userLocation,
}: NavigationAppSelectorProps) => {
  const [rememberChoice, setRememberChoice] = useState(false);

  const handleAppSelect = (app: NavigationApp) => {
    const destination = `${latitude},${longitude}`;
    const origin = userLocation ? `${userLocation[0]},${userLocation[1]}` : '';

    let url = '';

    switch (app) {
      case 'waze':
        url = `https://waze.com/ul?ll=${destination}&navigate=yes`;
        break;
      case 'google':
        url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
        break;
      case 'apple':
        url = `https://maps.apple.com/?daddr=${destination}`;
        break;
    }

    // Save preference if toggle is active
    if (rememberChoice) {
      localStorage.setItem('preferredNavigationApp', app);
    }

    window.open(url, '_blank');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerOverlay className="bg-black/70 backdrop-blur-sm" />
      <DrawerContent className="rounded-t-3xl max-h-[85vh]">
        <DrawerClose className="absolute top-4 right-4 w-10 h-10 rounded-full bg-gray-900 flex items-center justify-center hover:bg-gray-800 transition-colors">
          <X className="h-5 w-5 text-white" />
        </DrawerClose>

        <DrawerHeader className="pt-8 pb-2">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Route className="h-10 w-10 text-primary" />
            </div>
          </div>
          <DrawerTitle className="text-center text-xl font-semibold">
            Escolha seu aplicativo preferido para dirigir
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-6 space-y-3 py-4">
          {navigationApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppSelect(app.id)}
              className={cn(
                'w-full p-5 rounded-xl border transition-all duration-200 flex items-center gap-4 shadow-sm',
                app.color
              )}
            >
              <span className="text-4xl">{app.icon}</span>
              <span className="font-semibold text-lg">{app.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between px-6 py-6 border-t">
          <div className="flex-1 pr-4">
            <p className="text-sm font-semibold mb-1">Lembrar da minha escolha</p>
            <p className="text-xs text-purple-600">
              Você pode alterar isso mais tarde nas configurações
            </p>
          </div>
          <Switch
            checked={rememberChoice}
            onCheckedChange={setRememberChoice}
          />
        </div>
      </DrawerContent>
    </Drawer>
  );
};
