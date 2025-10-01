import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Battery, Users, CheckCircle2, Clock } from 'lucide-react';

interface Activity {
  icon: any;
  title: string;
  description: string;
  time: string;
  status: 'completed' | 'new' | 'active';
}

export const useRecentActivities = () => {
  return useQuery({
    queryKey: ['recent-activities'],
    queryFn: async (): Promise<Activity[]> => {
      // Get last 5 sessions
      const { data: sessions } = await supabase
        .from('charging_sessions')
        .select(`
          *,
          chargers(name),
          profiles(full_name)
        `)
        .order('started_at', { ascending: false })
        .limit(5);

      const activities: Activity[] = [];

      sessions?.forEach(session => {
        const startedAt = new Date(session.started_at);
        const now = new Date();
        const diffMs = now.getTime() - startedAt.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        
        let timeText = '';
        if (diffMins < 60) {
          timeText = `${diffMins} min atrás`;
        } else if (diffHours < 24) {
          timeText = `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
        } else {
          const diffDays = Math.floor(diffHours / 24);
          timeText = `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
        }

        let icon = Battery;
        let title = '';
        let description = '';
        let status: 'completed' | 'new' | 'active' = 'completed';

        if (session.status === 'completed') {
          icon = Battery;
          title = 'Sessão de carregamento concluída';
          description = `${session.chargers?.name || 'Carregador'} - ${session.vehicle_info || 'Veículo'}`;
          status = 'completed';
        } else if (session.status === 'in_progress') {
          icon = Clock;
          title = 'Carregamento em andamento';
          description = `${session.chargers?.name || 'Carregador'} - ${session.vehicle_info || 'Veículo'}`;
          status = 'active';
        } else {
          icon = CheckCircle2;
          title = 'Sessão cancelada';
          description = `${session.chargers?.name || 'Carregador'}`;
          status = 'new';
        }

        activities.push({ icon, title, description, time: timeText, status });
      });

      return activities;
    },
    refetchInterval: 30000,
  });
};
