import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useTranslation } from 'react-i18next';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChargerDetailsModal } from './ChargerDetailsDrawer';

interface Charger {
  id: string;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  status: string;
  power: number;
  pricePerKwh: number;
  connectorType: string;
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
  const [mapLoaded, setMapLoaded] = useState(false);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);

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

  // Initialize map ONCE
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || map.current) {
      return;
    }

    console.log('[StationsMap] Initializing map...');
    mapboxgl.accessToken = mapboxToken;

    const initialCenter: [number, number] = [-46.6333, -23.5505]; // São Paulo as default
    const initialZoom = 11;

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: initialZoom,
      });

      map.current.on('load', () => {
        console.log('[StationsMap] Map loaded successfully');
        setMapLoaded(true);
      });

      map.current.on('error', (e) => {
        console.error('[StationsMap] Map error:', e);
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );
    } catch (error) {
      console.error('[StationsMap] Failed to initialize map:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
        setMapLoaded(false);
      }
    };
  }, [mapboxToken]);

  // Handle user location marker separately (without recreating map)
  useEffect(() => {
    if (!map.current || !mapLoaded || !userLocation) return;

    // Remove existing user marker if any
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
    }

    // Add user location marker
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position:relative;width:40px;height:40px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:36px;height:36px;border-radius:50%;background:rgba(59,130,246,0.2);animation:pulse-ring 1.5s ease-out infinite;"></div>
        <div style="width:14px;height:14px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 6px rgba(0,0,0,0.3);"></div>
      </div>
    `;

    if (!document.getElementById('pulse-ring-style')) {
      const style = document.createElement('style');
      style.id = 'pulse-ring-style';
      style.textContent = `@keyframes pulse-ring { 0% { transform:scale(0.5);opacity:1; } 100% { transform:scale(1.2);opacity:0; } }`;
      document.head.appendChild(style);
    }

    userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
      .setLngLat(userLocation)
      .setPopup(
        new mapboxgl.Popup().setHTML(`
          <div class="p-2">
            <p class="font-semibold">${t('stations.myLocation')}</p>
          </div>
        `)
      )
      .addTo(map.current);

    // Center on user location
    map.current.flyTo({
      center: userLocation,
      zoom: 13,
      duration: 1500,
    });
  }, [userLocation, mapLoaded, t]);

  // Add charger markers when map is loaded
  useEffect(() => {
    if (!map.current || !mapLoaded) {
      console.warn('[StationsMap] Map not ready, skipping markers');
      return;
    }

    console.log('[StationsMap] Adding markers for', chargers.length, 'chargers');

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    let addedCount = 0;
    let skippedCount = 0;

    // Add new markers
    chargers.forEach((charger) => {
      if (!map.current) return;

      // Validate coordinates before creating marker
      const lat = Number(charger.latitude);
      const lng = Number(charger.longitude);
      
      // Check if coordinates are valid
      if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
        console.warn(`[StationsMap] Invalid coordinates for charger ${charger.name}: lat=${charger.latitude}, lng=${charger.longitude}`);
        skippedCount++;
        return;
      }

      const markerColor = 
        charger.status === 'available' ? '#22c55e' :
        charger.status === 'in_use' ? '#ef4444' :
        '#6b7280';

      const marker = new mapboxgl.Marker({ color: markerColor })
        .setLngLat([lng, lat])
        .addTo(map.current);

      // Add click event to open drawer
      marker.getElement().addEventListener('click', () => {
        setSelectedCharger(charger);
        setIsDrawerOpen(true);
      });

      markersRef.current.push(marker);
      addedCount++;
    });

    console.log(`[StationsMap] Markers added: ${addedCount}, skipped: ${skippedCount}`);
  }, [chargers, mapLoaded]);

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
          <LocateFixed className="h-5 w-5" />
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