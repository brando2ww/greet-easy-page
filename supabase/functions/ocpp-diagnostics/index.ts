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
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OCPP_SERVER_URL || !OCPP_INTERNAL_KEY) {
      return new Response(JSON.stringify({ error: 'OCPP server not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Auth: precisa de admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: isAdmin } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin',
    });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action } = body;

    console.log(`[ocpp-diagnostics] action=${action} user=${user.id}`);

    if (action === 'messages') {
      const cp = String(body.chargePointId || '').trim();
      const limit = Number(body.limit || 100);
      if (!cp) {
        return new Response(JSON.stringify({ error: 'chargePointId required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const r = await fetch(`${OCPP_SERVER_URL}/admin/messages?cp=${encodeURIComponent(cp)}&limit=${limit}`, {
        headers: { 'x-internal-key': OCPP_INTERNAL_KEY },
      });
      const json = await r.json();
      return new Response(JSON.stringify(json), {
        status: r.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'connections') {
      const r = await fetch(`${OCPP_SERVER_URL}/admin/active-connections`, {
        headers: { 'x-internal-key': OCPP_INTERNAL_KEY },
      });
      const json = await r.json();
      return new Response(JSON.stringify(json), {
        status: r.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'trigger') {
      const { chargePointId, requestedMessage, connectorId } = body;
      if (!chargePointId || !requestedMessage) {
        return new Response(JSON.stringify({ error: 'chargePointId and requestedMessage required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const r = await fetch(`${OCPP_SERVER_URL}/api/trigger-message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-key': OCPP_INTERNAL_KEY,
        },
        body: JSON.stringify({ chargePointId, requestedMessage, connectorId }),
      });
      const json = await r.json();
      return new Response(JSON.stringify(json), {
        status: r.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action. Use: messages | connections | trigger' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ocpp-diagnostics] Error:', err);
    const message = err instanceof Error ? err.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
