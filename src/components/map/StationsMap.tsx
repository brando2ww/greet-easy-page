import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from 'react-i18next';
import { Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

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

interface StationsMapProps {
  chargers: Charger[];
  mapboxToken: string;
}

export const StationsMap = ({ chargers, mapboxToken }: StationsMapProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation([position.coords.longitude, position.coords.latitude]);
        },
        (error) => {
          console.error('Error getting location:', error);
          toast({
            title: t('stations.locationPermissionDenied'),
            description: t('stations.locationPermissionDescription'),
            variant: "destructive",
          });
        }
      );
    }
  }, [t, toast]);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const initialCenter: [number, number] = userLocation || [-46.6333, -23.5505]; // São Paulo as default
    const initialZoom = userLocation ? 13 : 11;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: initialCenter,
      zoom: initialZoom,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add user location marker
    if (userLocation) {
      new mapboxgl.Marker({ color: '#3b82f6' })
        .setLngLat(userLocation)
        .setPopup(
          new mapboxgl.Popup().setHTML(`
            <div class="p-2">
              <p class="font-semibold">${t('stations.myLocation')}</p>
            </div>
          `)
        )
        .addTo(map.current);
    }

    return () => {
      map.current?.remove();
    };
  }, [mapboxToken, userLocation, t]);

  // Add charger markers
  useEffect(() => {
    if (!map.current) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    chargers.forEach((charger) => {
      if (!map.current) return;

      const markerColor = 
        charger.status === 'available' ? '#22c55e' :
        charger.status === 'in_use' ? '#ef4444' :
        '#6b7280';

      const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
        <div class="p-3 min-w-[200px]">
          <h3 class="font-semibold text-base mb-2">${charger.name}</h3>
          <p class="text-sm text-muted-foreground mb-1">${charger.location}</p>
          <div class="flex items-center gap-2 mb-1">
            <span class="inline-block w-2 h-2 rounded-full" style="background-color: ${markerColor}"></span>
            <span class="text-sm capitalize">${charger.status.replace('_', ' ')}</span>
          </div>
          <p class="text-sm mb-1"><strong>${t('stations.powerKw')}:</strong> ${charger.power} kW</p>
          <p class="text-sm mb-1"><strong>${t('stations.pricePerKwh')}:</strong> R$ ${charger.price_per_kwh.toFixed(2)}</p>
          <p class="text-sm mb-3"><strong>${t('stations.connector')}:</strong> ${charger.connector_type}</p>
          ${charger.status === 'available' ? `
            <button 
              class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md text-sm transition-colors"
              onclick="window.location.href='/iniciar-carga?charger=${charger.id}'"
            >
              ${t('stations.startCharging')}
            </button>
          ` : ''}
        </div>
      `);

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([charger.longitude, charger.latitude])
        .setPopup(popup)
        .addTo(map.current);

      markersRef.current.push(marker);
    });
  }, [chargers, t]);

  const centerOnUserLocation = () => {
    if (map.current && userLocation) {
      map.current.flyTo({
        center: userLocation,
        zoom: 14,
        duration: 1500,
      });
    } else {
      toast({
        title: t('stations.locationUnavailable'),
        description: t('stations.enableLocation'),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
      {userLocation && (
        <Button
          onClick={centerOnUserLocation}
          size="icon"
          className="absolute bottom-4 right-4 bg-white hover:bg-gray-100 text-gray-900 shadow-lg z-10"
          title={t('stations.centerOnMyLocation')}
        >
          <Navigation className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
};
