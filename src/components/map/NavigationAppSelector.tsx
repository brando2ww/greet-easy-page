import React, { useState } from 'react';
import { Route } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
  },
  {
    id: 'google' as NavigationApp,
    name: 'Google Maps',
    icon: '🗺',
    color: 'bg-green-50 hover:bg-green-100 border-green-200',
  },
  {
    id: 'apple' as NavigationApp,
    name: 'Apple Maps',
    icon: '🧭',
    color: 'bg-gray-50 hover:bg-gray-100 border-gray-200',
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Route className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl">
            Escolha seu aplicativo preferido para dirigir
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {navigationApps.map((app) => (
            <button
              key={app.id}
              onClick={() => handleAppSelect(app.id)}
              className={cn(
                'w-full p-4 rounded-lg border-2 transition-all flex items-center gap-4',
                app.color
              )}
            >
              <span className="text-3xl">{app.icon}</span>
              <span className="font-medium text-lg">{app.name}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex-1">
            <p className="text-sm font-medium mb-1">Lembrar da minha escolha</p>
            <p className="text-xs text-primary">
              Você pode alterar isso mais tarde nas configurações
            </p>
          </div>
          <Switch
            checked={rememberChoice}
            onCheckedChange={setRememberChoice}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
