import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OCPP_SERVER_URL = Deno.env.get('OCPP_SERVER_URL');
const OCPP_INTERNAL_KEY = Deno.env.get('OCPP_INTERNAL_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth required
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { chargerId, chargePointId: cpFromBody } = await req.json().catch(() => ({}));
    let chargePointId = cpFromBody as string | undefined;

    // Resolve chargePointId from chargerId if needed
    let dbCharger: any = null;
    if (chargerId) {
      const { data } = await supabaseAdmin
        .from('chargers')
        .select('id, ocpp_charge_point_id, ocpp_protocol_status, last_heartbeat')
        .eq('id', chargerId)
        .maybeSingle();
      dbCharger = data;
      chargePointId = data?.ocpp_charge_point_id ?? chargePointId;
    } else if (chargePointId) {
      const { data } = await supabaseAdmin
        .from('chargers')
        .select('id, ocpp_charge_point_id, ocpp_protocol_status, last_heartbeat')
        .eq('ocpp_charge_point_id', chargePointId)
        .maybeSingle();
      dbCharger = data;
    }

    if (!chargePointId) {
      return new Response(JSON.stringify({ error: 'chargerId or chargePointId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let isLive = false;
    let serverReachable = false;

    if (OCPP_SERVER_URL && OCPP_INTERNAL_KEY) {
      try {
        const r = await fetch(`${OCPP_SERVER_URL}/api/connections`, {
          headers: { 'x-internal-key': OCPP_INTERNAL_KEY },
        });
        if (r.ok) {
          serverReachable = true;
          const json = await r.json();
          const list: string[] = Array.isArray(json?.connections) ? json.connections : [];
          isLive = list.includes(String(chargePointId));
        }
      } catch (e) {
        console.error('[ocpp-live-status] OCPP fetch failed:', (e as Error).message);
      }
    }

    // Auto-heal: if live but DB says Offline, promote to Available + refresh heartbeat
    if (isLive && dbCharger && dbCharger.ocpp_protocol_status !== 'Charging' && dbCharger.ocpp_protocol_status !== 'Preparing') {
      await supabaseAdmin
        .from('chargers')
        .update({ last_heartbeat: new Date().toISOString(), ocpp_protocol_status: 'Available' })
        .eq('ocpp_charge_point_id', chargePointId);
      console.log('[ocpp-live-status] Auto-healed to Available:', chargePointId);
    }

    return new Response(JSON.stringify({
      chargePointId,
      isLive,
      serverReachable,
      ocppStatus: isLive ? 'Available' : (dbCharger?.ocpp_protocol_status ?? null),
      lastHeartbeat: isLive ? new Date().toISOString() : (dbCharger?.last_heartbeat ?? null),
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    console.error('[ocpp-live-status] Error:', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
