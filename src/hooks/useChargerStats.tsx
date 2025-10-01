import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, format, eachDayOfInterval } from 'date-fns';

export interface ChargerDailyData {
  date: string;
  sessions: number;
  revenue: number;
}

export interface ChargerStats {
  chargerId: string;
  sessionsCount: number;
  totalRevenue: number;
  totalEnergy: number;
  utilizationRate: number;
  dailyData: ChargerDailyData[];
}

export const useChargerStats = (chargerId: string) => {
  return useQuery({
    queryKey: ['charger-stats', chargerId],
    queryFn: async () => {
      const endDate = new Date();
      const startDate = subDays(endDate, 6); // Last 7 days

      // Fetch charging sessions for this charger
      const { data: sessions, error } = await supabase
        .from('charging_sessions')
        .select('*')
        .eq('charger_id', chargerId)
        .gte('started_at', startDate.toISOString())
        .lte('started_at', endDate.toISOString());

      if (error) throw error;

      // Generate all days in the period
      const allDays = eachDayOfInterval({ start: startDate, end: endDate });
      
      // Group sessions by day
      const dailyMap = new Map<string, { sessions: number; revenue: number }>();
      
      allDays.forEach(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        dailyMap.set(dateKey, { sessions: 0, revenue: 0 });
      });

      // Calculate daily stats
      sessions?.forEach(session => {
        const dateKey = format(new Date(session.started_at), 'yyyy-MM-dd');
        const current = dailyMap.get(dateKey);
        if (current) {
          current.sessions += 1;
          current.revenue += Number(session.cost || 0);
        }
      });

      // Convert map to array
      const dailyData: ChargerDailyData[] = allDays.map(day => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const data = dailyMap.get(dateKey) || { sessions: 0, revenue: 0 };
        return {
          date: dateKey,
          sessions: data.sessions,
          revenue: data.revenue,
        };
      });

      // Calculate totals
      const sessionsCount = sessions?.length || 0;
      const totalRevenue = sessions?.reduce((sum, s) => sum + Number(s.cost || 0), 0) || 0;
      const totalEnergy = sessions?.reduce((sum, s) => sum + Number(s.energy_consumed || 0), 0) || 0;
      
      // Calculate utilization rate (simplified: sessions/days as percentage)
      const utilizationRate = sessionsCount > 0 ? Math.min((sessionsCount / 7) * 100, 100) : 0;

      const stats: ChargerStats = {
        chargerId,
        sessionsCount,
        totalRevenue,
        totalEnergy,
        utilizationRate,
        dailyData,
      };

      return stats;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};
