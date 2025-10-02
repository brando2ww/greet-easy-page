import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export type VehicleType = 'hybrid' | 'electric';

export interface Vehicle {
  id: string;
  user_id: string;
  brand: string;
  model: string;
  year: number;
  plate: string | null;
  color: string;
  plug_type: string;
  battery_capacity: number;
  chassi: string | null;
  autonomy: number | null;
  type: VehicleType;
  created_at: string;
  updated_at: string;
}

export interface VehicleFormData {
  brand: string;
  model: string;
  year: number;
  plate?: string;
  color: string;
  plug_type: string;
  battery_capacity: number;
  chassi?: string;
  autonomy?: number;
  type: VehicleType;
}

export const useVehicles = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: vehicles = [], isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async (): Promise<Vehicle[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  const addVehicle = useMutation({
    mutationFn: async (vehicleData: VehicleFormData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data, error } = await supabase
        .from('vehicles')
        .insert([
          {
            ...vehicleData,
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Veículo adicionado',
        description: 'O veículo foi adicionado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao adicionar veículo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: VehicleFormData }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const { data: updatedVehicle, error } = await supabase
        .from('vehicles')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return updatedVehicle;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Veículo atualizado',
        description: 'O veículo foi atualizado com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao atualizar veículo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (vehicleId: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast({
        title: 'Veículo removido',
        description: 'O veículo foi removido com sucesso.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro ao remover veículo',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  return {
    vehicles,
    isLoading,
    addVehicle: addVehicle.mutate,
    updateVehicle: updateVehicle.mutate,
    deleteVehicle: deleteVehicle.mutate,
    isAddingVehicle: addVehicle.isPending,
    isUpdatingVehicle: updateVehicle.isPending,
    isDeletingVehicle: deleteVehicle.isPending,
  };
};
