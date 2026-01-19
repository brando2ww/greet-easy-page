import { useQuery } from '@tanstack/react-query';
import { chargersApi } from '@/services/api';
import type { ChargePoint } from '@/types/charger';

export const useChargers = () => {
  return useQuery({
    queryKey: ['chargers'],
    queryFn: async (): Promise<ChargePoint[]> => {
      const result = await chargersApi.list();
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      // Filter chargers with valid coordinates for map display
      return (result.data || []).filter(
        (charger) => charger.latitude != null && charger.longitude != null
      );
    },
  });
};
