import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface DashboardStats {
  totalUsers: number;
  activeChargers: number;
  totalSessions: number;
  totalRevenue: number;
  trends: {
    users: number;
    chargers: number;
    sessions: number;
    revenue: number;
  };
}

export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      const now = new Date();
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const previous7Days = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

      // Total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Active chargers (available status)
      const { data: chargers } = await supabase
        .from('chargers')
        .select('status');
      
      const activeChargers = chargers?.filter(c => c.status === 'available').length || 0;

      // Total sessions (last 7 days)
      const { count: totalSessions } = await supabase
        .from('charging_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', last7Days.toISOString());

      // Previous period sessions
      const { count: previousSessions } = await supabase
        .from('charging_sessions')
        .select('*', { count: 'exact', head: true })
        .gte('started_at', previous7Days.toISOString())
        .lt('started_at', last7Days.toISOString());

      // Total revenue (last 7 days)
      const { data: sessions } = await supabase
        .from('charging_sessions')
        .select('cost')
        .gte('started_at', last7Days.toISOString())
        .eq('status', 'completed');

      const totalRevenue = sessions?.reduce((sum, s) => sum + (Number(s.cost) || 0), 0) || 0;

      // Previous period revenue
      const { data: previousSessionsData } = await supabase
        .from('charging_sessions')
        .select('cost')
        .gte('started_at', previous7Days.toISOString())
        .lt('started_at', last7Days.toISOString())
        .eq('status', 'completed');

      const previousRevenue = previousSessionsData?.reduce((sum, s) => sum + (Number(s.cost) || 0), 0) || 0;

      // Calculate trends
      const calculateTrend = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return ((current - previous) / previous) * 100;
      };

      return {
        totalUsers: totalUsers || 0,
        activeChargers,
        totalSessions: totalSessions || 0,
        totalRevenue,
        trends: {
          users: 12, // User growth not tracked yet
          chargers: 5, // Charger growth not tracked yet
          sessions: calculateTrend(totalSessions || 0, previousSessions || 0),
          revenue: calculateTrend(totalRevenue, previousRevenue),
        },
      };
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
