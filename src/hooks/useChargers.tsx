import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

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
  serial_number: string | null;
  client_id: string | null;
  partner_client_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export const useChargers = () => {
  return useQuery({
    queryKey: ['chargers'],
    queryFn: async (): Promise<Charger[]> => {
      const { data, error } = await supabase
        .from('chargers')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (error) throw error;
      return data || [];
    },
  });
};
