import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChartData {
  date: string;
  sessions: number;
  users: number;
}

export const useDashboardChart = () => {
  return useQuery({
    queryKey: ['dashboard-chart'],
    queryFn: async (): Promise<ChartData[]> => {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Get sessions grouped by day
      const { data: sessions } = await supabase
        .from('charging_sessions')
        .select('started_at')
        .gte('started_at', last7Days.toISOString());

      // Get users grouped by day
      const { data: users } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', last7Days.toISOString());

      // Group by day
      const chartData: Record<string, ChartData> = {};
      
      // Initialize last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        chartData[dateKey] = { date: dateKey, sessions: 0, users: 0 };
      }

      // Count sessions per day
      sessions?.forEach(session => {
        const date = new Date(session.started_at);
        const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        if (chartData[dateKey]) {
          chartData[dateKey].sessions++;
        }
      });

      // Count users per day
      users?.forEach(user => {
        const date = new Date(user.created_at);
        const dateKey = date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
        if (chartData[dateKey]) {
          chartData[dateKey].users++;
        }
      });

      return Object.values(chartData);
    },
    refetchInterval: 30000,
  });
};
