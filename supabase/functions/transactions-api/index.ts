import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface TransactionRow {
  id: string;
  transaction_id: number | null;
  charger_id: string;
  user_id: string;
  started_at: string;
  ended_at: string | null;
  meter_start: number | null;
  meter_stop: number | null;
  energy_consumed: number | null;
  cost: number | null;
  status: string;
  stop_reason: string | null;
  id_tag: string | null;
  vehicle_info: string | null;
  chargers?: { name: string; location: string };
}

interface Transaction {
  id: string;
  transactionId: number | null;
  chargerId: string;
  userId: string;
  startedAt: string;
  endedAt: string | null;
  meterStart: number | null;
  meterStop: number | null;
  energyConsumed: number | null;
  cost: number | null;
  status: string;
  stopReason: string | null;
  idTag: string | null;
  vehicleInfo: string | null;
  charger?: { name: string; location: string };
}

function mapRowToTransaction(row: TransactionRow): Transaction {
  return {
    id: row.id,
    transactionId: row.transaction_id,
    chargerId: row.charger_id,
    userId: row.user_id,
    startedAt: row.started_at,
    endedAt: row.ended_at,
    meterStart: row.meter_start,
    meterStop: row.meter_stop,
    energyConsumed: row.energy_consumed,
    cost: row.cost,
    status: row.status,
    stopReason: row.stop_reason,
    idTag: row.id_tag,
    vehicleInfo: row.vehicle_info,
    charger: row.chargers ? {
      name: row.chargers.name,
      location: row.chargers.location,
    } : undefined,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get authorization header for user context
    const authHeader = req.headers.get('Authorization') ?? req.headers.get('authorization');

    // Check for service role key (for internal/seeding operations)
    const isServiceRole = authHeader === `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`;

    let userId = '';
    let isAdmin = false;

    if (isServiceRole) {
      isAdmin = true;
      userId = 'service-role';
    } else {
      if (!authHeader?.startsWith('Bearer ')) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const token = authHeader.replace('Bearer ', '');

      // Validate token by fetching the user
      const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!);

      const { data: userData, error: userError } = await supabaseUser.auth.getUser(token);

      if (userError || !userData?.user) {
        console.warn('[transactions-api] Invalid token:', userError);
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = userData.user.id;

      // Check if user is admin
      const { data: roleData } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      isAdmin = !!roleData;
    }

    const body = await req.json();
    const { action, id } = body;

    console.log(`[transactions-api] Action: ${action}, User: ${userId}, Admin: ${isAdmin}`);

    switch (action) {
      case 'list': {
        const { data: sessions, error } = await supabaseAdmin
          .from('charging_sessions')
          .select(`
            *,
            chargers (name, location)
          `)
          .eq('user_id', userId)
          .order('started_at', { ascending: false });

        if (error) throw error;

        const mapped = (sessions as TransactionRow[]).map(mapRowToTransaction);
        return new Response(JSON.stringify(mapped), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'get': {
        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const query = supabaseAdmin
          .from('charging_sessions')
          .select(`
            *,
            chargers (name, location)
          `)
          .eq('id', id);

        // Non-admins can only see their own sessions
        if (!isAdmin) {
          query.eq('user_id', userId);
        }

        const { data: session, error } = await query.single();

        if (error) {
          if (error.code === 'PGRST116') {
            return new Response(JSON.stringify({ error: 'Transaction not found' }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
          throw error;
        }

        return new Response(JSON.stringify(mapRowToTransaction(session)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'listAll': {
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: sessions, error } = await supabaseAdmin
          .from('charging_sessions')
          .select(`
            *,
            chargers (name, location)
          `)
          .order('started_at', { ascending: false })
          .limit(100);

        if (error) throw error;

        const mapped = (sessions as TransactionRow[]).map(mapRowToTransaction);
        return new Response(JSON.stringify(mapped), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'weeklyStats': {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

        // Current period (last 7 days)
        const { data: currentSessions, error: csErr } = await supabaseAdmin
          .from('charging_sessions')
          .select('started_at, energy_consumed')
          .eq('user_id', userId)
          .in('status', ['completed', 'in_progress'])
          .gte('started_at', sevenDaysAgo.toISOString())
          .order('started_at', { ascending: true });

        if (csErr) throw csErr;

        // Previous period (7-14 days ago)
        const { data: prevSessions, error: psErr } = await supabaseAdmin
          .from('charging_sessions')
          .select('energy_consumed')
          .eq('user_id', userId)
          .in('status', ['completed', 'in_progress'])
          .gte('started_at', fourteenDaysAgo.toISOString())
          .lt('started_at', sevenDaysAgo.toISOString());

        if (psErr) throw psErr;

        // Build daily data for last 7 days
        const dayLabels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const dailyData: { date: string; dayLabel: string; energy: number }[] = [];

        for (let i = 6; i >= 0; i--) {
          const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = d.toISOString().split('T')[0];
          const dayLabel = i === 0 ? 'Hoje' : dayLabels[d.getDay()];
          dailyData.push({ date: dateStr, dayLabel, energy: 0 });
        }

        // Aggregate energy per day
        for (const s of (currentSessions || [])) {
          const dateStr = new Date(s.started_at).toISOString().split('T')[0];
          const entry = dailyData.find(d => d.date === dateStr);
          if (entry) {
            entry.energy += Number(s.energy_consumed || 0);
          }
        }

        // Round values
        dailyData.forEach(d => { d.energy = Math.round(d.energy * 100) / 100; });

        const currentPeriodTotal = dailyData.reduce((sum, d) => sum + d.energy, 0);
        const previousPeriodTotal = (prevSessions || []).reduce(
          (sum, s) => sum + Number(s.energy_consumed || 0), 0
        );

        let changePercent = 0;
        if (previousPeriodTotal > 0) {
          changePercent = Math.round(((currentPeriodTotal - previousPeriodTotal) / previousPeriodTotal) * 100);
        }

        return new Response(JSON.stringify({
          dailyData,
          currentPeriodTotal: Math.round(currentPeriodTotal * 100) / 100,
          previousPeriodTotal: Math.round(previousPeriodTotal * 100) / 100,
          changePercent,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'adminReport': {
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // All sessions
        const { data: allSessions, error: allErr } = await supabaseAdmin
          .from('charging_sessions')
          .select('*, chargers (name, location)')
          .order('started_at', { ascending: false });

        if (allErr) throw allErr;

        // All profiles
        const { data: allProfiles } = await supabaseAdmin
          .from('profiles')
          .select('id, email, full_name');

        // All chargers
        const { data: allChargers } = await supabaseAdmin
          .from('chargers')
          .select('id, name, location');

        const profileMap = new Map((allProfiles || []).map(p => [p.id, p]));
        const sessions = allSessions || [];

        const completedSessions = sessions.filter(s => s.status === 'completed');
        const totalEnergy = sessions.reduce((sum, s) => sum + Number(s.energy_consumed || 0), 0);
        const totalRevenue = sessions.reduce((sum, s) => sum + Number(s.cost || 0), 0);
        const uniqueUsers = new Set(sessions.map(s => s.user_id)).size;

        // Average duration (minutes)
        const durationsMs = completedSessions
          .filter(s => s.ended_at)
          .map(s => new Date(s.ended_at!).getTime() - new Date(s.started_at).getTime());
        const avgDurationMin = durationsMs.length > 0
          ? Math.round(durationsMs.reduce((a, b) => a + b, 0) / durationsMs.length / 60000)
          : 0;

        // Sessions by day (last 30 days)
        const now = new Date();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const dailyMap: Record<string, { count: number; energy: number; revenue: number }> = {};
        for (let i = 29; i >= 0; i--) {
          const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
          dailyMap[d.toISOString().split('T')[0]] = { count: 0, energy: 0, revenue: 0 };
        }
        for (const s of sessions) {
          const dateStr = new Date(s.started_at).toISOString().split('T')[0];
          if (dailyMap[dateStr]) {
            dailyMap[dateStr].count++;
            dailyMap[dateStr].energy += Number(s.energy_consumed || 0);
            dailyMap[dateStr].revenue += Number(s.cost || 0);
          }
        }
        const dailyData = Object.entries(dailyMap).map(([date, v]) => ({ date, ...v }));

        // Sessions by charger
        const chargerMap: Record<string, { name: string; location: string; count: number; energy: number; revenue: number; totalDurationMin: number }> = {};
        for (const s of sessions) {
          if (!chargerMap[s.charger_id]) {
            const ch = s.chargers as any;
            chargerMap[s.charger_id] = { name: ch?.name || 'Desconhecido', location: ch?.location || '', count: 0, energy: 0, revenue: 0, totalDurationMin: 0 };
          }
          chargerMap[s.charger_id].count++;
          chargerMap[s.charger_id].energy += Number(s.energy_consumed || 0);
          chargerMap[s.charger_id].revenue += Number(s.cost || 0);
          if (s.ended_at) {
            chargerMap[s.charger_id].totalDurationMin += (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000;
          }
        }
        const byCharger = Object.values(chargerMap).map(c => ({
          ...c,
          energy: Math.round(c.energy * 100) / 100,
          revenue: Math.round(c.revenue * 100) / 100,
          avgDurationMin: c.count > 0 ? Math.round(c.totalDurationMin / c.count) : 0,
        }));

        // Recent sessions (last 20)
        const recentSessions = sessions.slice(0, 20).map(s => {
          const profile = profileMap.get(s.user_id);
          const durationMin = s.ended_at
            ? Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)
            : null;
          return {
            id: s.id,
            startedAt: s.started_at,
            endedAt: s.ended_at,
            chargerName: (s.chargers as any)?.name || 'Desconhecido',
            userEmail: profile?.email || 'Desconhecido',
            userName: profile?.full_name || '',
            durationMin,
            energyConsumed: s.energy_consumed,
            cost: s.cost,
            status: s.status,
          };
        });

        // Sessions by user
        const userMap: Record<string, { email: string; name: string; count: number; energy: number; revenue: number; totalDurationMin: number }> = {};
        for (const s of sessions) {
          if (!userMap[s.user_id]) {
            const profile = profileMap.get(s.user_id);
            userMap[s.user_id] = { email: profile?.email || 'Desconhecido', name: profile?.full_name || '', count: 0, energy: 0, revenue: 0, totalDurationMin: 0 };
          }
          userMap[s.user_id].count++;
          userMap[s.user_id].energy += Number(s.energy_consumed || 0);
          userMap[s.user_id].revenue += Number(s.cost || 0);
          if (s.ended_at) {
            userMap[s.user_id].totalDurationMin += (new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000;
          }
        }
        const byUser = Object.values(userMap).map(u => ({
          ...u,
          energy: Math.round(u.energy * 100) / 100,
          revenue: Math.round(u.revenue * 100) / 100,
          avgDurationMin: u.count > 0 ? Math.round(u.totalDurationMin / u.count) : 0,
        }));

        return new Response(JSON.stringify({
          summary: {
            totalSessions: sessions.length,
            completedSessions: completedSessions.length,
            totalEnergy: Math.round(totalEnergy * 100) / 100,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            avgDurationMin,
            uniqueUsers,
            totalChargers: (allChargers || []).length,
          },
          dailyData,
          byCharger,
          recentSessions,
          byUser,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'seedSessionData': {
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { sessions: sessionsToUpdate } = body;
        if (!Array.isArray(sessionsToUpdate)) {
          return new Response(JSON.stringify({ error: 'sessions array required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const results = [];
        for (const s of sessionsToUpdate) {
          const updateData: Record<string, any> = {};
          if (s.energy_consumed !== undefined) updateData.energy_consumed = s.energy_consumed;
          if (s.cost !== undefined) updateData.cost = s.cost;
          if (s.meter_start !== undefined) updateData.meter_start = s.meter_start;
          if (s.meter_stop !== undefined) updateData.meter_stop = s.meter_stop;
          if (s.status !== undefined) updateData.status = s.status;
          if (s.ended_at !== undefined) updateData.ended_at = s.ended_at;
          if (s.stop_reason !== undefined) updateData.stop_reason = s.stop_reason;

          const { error } = await supabaseAdmin
            .from('charging_sessions')
            .update(updateData)
            .eq('id', s.id);

          results.push({ id: s.id, success: !error, error: error?.message });
        }

        return new Response(JSON.stringify({ results }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getActive': {
        const { data: session, error } = await supabaseAdmin
          .from('charging_sessions')
          .select(`
            *,
            chargers (name, location)
          `)
          .eq('user_id', userId)
          .eq('status', 'in_progress')
          .order('started_at', { ascending: false })
          .maybeSingle();

        if (error) throw error;

        if (!session) {
          return new Response(JSON.stringify(null), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(mapRowToTransaction(session)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[transactions-api] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
