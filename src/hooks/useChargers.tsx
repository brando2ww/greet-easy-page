import { useQuery } from '@tanstack/react-query';
import { chargersApi } from '@/services/api';
import type { ChargePoint } from '@/types/charger';

export const useChargers = () => {
  return useQuery({
    queryKey: ['chargers'],
    queryFn: async (): Promise<ChargePoint[]> => {
      console.log('[useChargers] Fetching chargers...');
      const result = await chargersApi.list();
      
      if (result.error) {
        console.error('[useChargers] API error:', result.error);
        throw new Error(result.error);
      }
      
      console.log('[useChargers] Raw data received:', result.data?.length ?? 0, 'chargers');
      
      // Filter chargers with valid coordinates for map display
      const validChargers = (result.data || []).filter(
        (charger) => charger.latitude != null && charger.longitude != null
      );
      
      console.log('[useChargers] Chargers with valid coordinates:', validChargers.length);
      
      if (validChargers.length > 0) {
        console.log('[useChargers] First charger:', {
          id: validChargers[0].id,
          name: validChargers[0].name,
          lat: validChargers[0].latitude,
          lng: validChargers[0].longitude,
          status: validChargers[0].status
        });
      }
      
      return validChargers;
    },
  });
};
