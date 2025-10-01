import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from 'react-i18next';
import { Navigation, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChargerDetailsModal } from './ChargerDetailsDrawer';

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
  const [selectedCharger, setSelectedCharger] = useState<Charger | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([charger.longitude, charger.latitude])
        .addTo(map.current);

      // Add click event to open drawer
      marker.getElement().addEventListener('click', () => {
        setSelectedCharger(charger);
        setIsDrawerOpen(true);
      });

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
          className="absolute bottom-24 right-4 bg-white hover:bg-gray-100 text-gray-900 shadow-lg z-10"
          title={t('stations.centerOnMyLocation')}
        >
          <Navigation className="h-5 w-5" />
        </Button>
      )}

      <ChargerDetailsModal
        charger={selectedCharger}
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedCharger(null);
        }}
        userLocation={userLocation}
      />
    </div>
  );
};
