import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OCPP_SERVER_URL = Deno.env.get('OCPP_SERVER_URL');
const OCPP_INTERNAL_KEY = Deno.env.get('OCPP_INTERNAL_KEY');

// Called by pg_cron every minute. No JWT required. No CORS needed.
Deno.serve(async (_req) => {
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const result: any = { healed: [], offlined: [], skipped: 0 };

  if (!OCPP_SERVER_URL || !OCPP_INTERNAL_KEY) {
    return new Response(JSON.stringify({ error: 'OCPP server not configured' }), { status: 500 });
  }

  let connectedCps: string[] = [];
  try {
    const r = await fetch(`${OCPP_SERVER_URL}/api/connections`, {
      headers: { 'x-internal-key': OCPP_INTERNAL_KEY },
    });
    if (!r.ok) throw new Error(`OCPP server HTTP ${r.status}`);
    const json = await r.json();
    connectedCps = Array.isArray(json?.connections) ? json.connections.map(String) : [];
  } catch (e) {
    console.error('[ocpp-sync-status] OCPP unreachable:', (e as Error).message);
    return new Response(JSON.stringify({ error: 'OCPP unreachable', detail: (e as Error).message }), { status: 502 });
  }

  // Heal: connected CPs that DB still shows Offline → Available
  if (connectedCps.length > 0) {
    const { data: healed } = await supabaseAdmin
      .from('chargers')
      .update({ last_heartbeat: new Date().toISOString(), ocpp_protocol_status: 'Available' })
      .in('ocpp_charge_point_id', connectedCps)
      .in('ocpp_protocol_status', ['Offline'])
      .select('ocpp_charge_point_id');
    result.healed = (healed ?? []).map((c: any) => c.ocpp_charge_point_id);

    // Also keep last_heartbeat fresh for connected CPs (regardless of status, except Charging/Preparing — those self-update)
    await supabaseAdmin
      .from('chargers')
      .update({ last_heartbeat: new Date().toISOString() })
      .in('ocpp_charge_point_id', connectedCps)
      .not('ocpp_protocol_status', 'in', '("Charging","Preparing")');
  }

  // Offline: CPs not in connectedCps with stale heartbeat (>10 min) and not already Offline
  const cutoff = new Date(Date.now() - 10 * 60_000).toISOString();
  let q = supabaseAdmin
    .from('chargers')
    .update({ ocpp_protocol_status: 'Offline' })
    .neq('ocpp_protocol_status', 'Offline')
    .lt('last_heartbeat', cutoff);
  if (connectedCps.length > 0) {
    const list = connectedCps.map((id) => `"${id.replace(/"/g, '')}"`).join(',');
    q = q.not('ocpp_charge_point_id', 'in', `(${list})`);
  }
  const { data: offlined } = await q.select('ocpp_charge_point_id');
  result.offlined = (offlined ?? []).map((c: any) => c.ocpp_charge_point_id);
  result.connectedCount = connectedCps.length;

  console.log('[ocpp-sync-status]', JSON.stringify(result));
  return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
});
