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
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    let isAdmin = false;

    if (authHeader) {
      const supabaseUser = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_ANON_KEY')!, {
        global: { headers: { Authorization: authHeader } }
      });
      
      const { data: { user } } = await supabaseUser.auth.getUser();
      if (user) {
        userId = user.id;
        
        // Check if user is admin
        const { data: roleData } = await supabaseAdmin
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        
        isAdmin = !!roleData;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
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
