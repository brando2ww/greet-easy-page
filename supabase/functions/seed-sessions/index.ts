import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const body = await req.json();
  const { sessions } = body;

  const results = [];
  for (const s of sessions) {
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
});
