import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const OCPP_SERVER_URL = Deno.env.get('OCPP_SERVER_URL');

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Extract token from Authorization header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
      
      if (authError) {
        console.error('[charger-commands] Auth error:', authError.message);
      }
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, chargerId, idTag, transactionId, sessionId, requestedMessage, connectorId } = body;

    console.log(`[charger-commands] Action: ${action}, User: ${userId}, Charger: ${chargerId}`);

    switch (action) {
      case 'start': {
        if (!chargerId) {
          return new Response(JSON.stringify({ error: 'chargerId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get charger details
        const { data: charger, error: chargerError } = await supabaseAdmin
          .from('chargers')
          .select('*')
          .eq('id', chargerId)
          .single();

        if (chargerError || !charger) {
          return new Response(JSON.stringify({ error: 'Charger not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check if charger is available (with auto-fix for stale status)
        if (charger.status !== 'available') {
          // Auto-fix: check if there are actually active sessions
          if (charger.status === 'in_use') {
            const { data: activeSessions } = await supabaseAdmin
              .from('charging_sessions')
              .select('id')
              .eq('charger_id', chargerId)
              .in('status', ['in_progress', 'awaiting_plug'])
              .limit(1);

            if (!activeSessions || activeSessions.length === 0) {
              // No active sessions — fix the stale status and continue
              await supabaseAdmin
                .from('chargers')
                .update({ status: 'available' })
                .eq('id', chargerId);
              console.log('[charger-commands] Auto-fixed stale in_use status for charger:', chargerId);
              // Update local reference so subsequent checks pass
              charger.status = 'available';
            }
          }

          // If still not available after auto-fix attempt, reject
          if (charger.status !== 'available') {
            return new Response(JSON.stringify({ 
              error: 'Charger not available',
              message: `Current status: ${charger.status}` 
            }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Check OCPP connection
        const validOcppStatuses = ['Available', 'Preparing'];
        if (!validOcppStatuses.includes(charger.ocpp_protocol_status || '')) {
          return new Response(JSON.stringify({ 
            error: 'Charger offline',
            message: 'O carregador não está conectado via OCPP' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check heartbeat freshness (must be within last 2 minutes)
        const lastHeartbeat = charger.last_heartbeat ? new Date(charger.last_heartbeat) : null;
        const isConnected = lastHeartbeat ? (Date.now() - lastHeartbeat.getTime()) < 120000 : false;

        if (!isConnected) {
          return new Response(JSON.stringify({ 
            error: 'Charger offline',
            message: 'O carregador não está respondendo. Verifique a conexão e tente novamente.'
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check user wallet balance (optional - can be disabled)
        const { data: wallet } = await supabaseAdmin
          .from('wallet_balances')
          .select('balance')
          .eq('user_id', userId)
          .maybeSingle();

        const balance = wallet?.balance || 0;
        if (balance < 5) { // Minimum R$ 5.00 to start
          return new Response(JSON.stringify({ 
            error: 'Insufficient balance',
            message: 'Add funds to your wallet to start charging' 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create charging session in awaiting_plug state (timer/billing starts only when plug connects)
        const { data: session, error: sessionError } = await supabaseAdmin
          .from('charging_sessions')
          .insert({
            charger_id: chargerId,
            user_id: userId,
            id_tag: idTag || userId,
            status: 'awaiting_plug',
          })
          .select()
          .single();

        if (sessionError) {
          console.error('[charger-commands] Session creation error:', sessionError);
          return new Response(JSON.stringify({ error: 'Failed to create session' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Call Railway OCPP server to send RemoteStartTransaction
        if (OCPP_SERVER_URL && charger.ocpp_charge_point_id) {
          try {
            const remoteStartResponse = await fetch(`${OCPP_SERVER_URL}/api/remote-start`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-internal-key': Deno.env.get('OCPP_INTERNAL_KEY')!,
              },
              body: JSON.stringify({
                chargePointId: charger.ocpp_charge_point_id,
                idTag: idTag || userId,
                connectorId: 1,
              }),
            });

            const remoteResult = await remoteStartResponse.json();
            console.log('[charger-commands] Remote start result:', remoteResult);

            if (!remoteResult.success) {
              // Rollback session if remote start failed
              await supabaseAdmin
                .from('charging_sessions')
                .delete()
                .eq('id', session.id);

              return new Response(JSON.stringify({ 
                error: 'Remote start failed',
                message: remoteResult.message || 'Could not start charging remotely'
              }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }

            // Update session with transaction ID from OCPP
            if (remoteResult.transactionId) {
              await supabaseAdmin
                .from('charging_sessions')
                .update({ transaction_id: remoteResult.transactionId })
                .eq('id', session.id);
            }
          } catch (fetchError) {
            console.error('[charger-commands] OCPP API error:', fetchError);
            // Continue anyway - charger might start locally
          }
        }

        // Update charger status
        await supabaseAdmin
          .from('chargers')
          .update({ status: 'in_use' })
          .eq('id', chargerId);

        return new Response(JSON.stringify({
          success: true,
          message: 'Charging session started',
          sessionId: session.id,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'stop': {
        if (!chargerId || (!transactionId && !sessionId)) {
          return new Response(JSON.stringify({ error: 'chargerId and transactionId or sessionId are required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Get charger details
        const { data: charger } = await supabaseAdmin
          .from('chargers')
          .select('ocpp_charge_point_id')
          .eq('id', chargerId)
          .single();

        if (!charger) {
          return new Response(JSON.stringify({ error: 'Charger not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Call Railway OCPP server to send RemoteStopTransaction (only if we have a transactionId)
        if (OCPP_SERVER_URL && charger.ocpp_charge_point_id && transactionId) {
          try {
            const remoteStopResponse = await fetch(`${OCPP_SERVER_URL}/api/remote-stop`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-internal-key': Deno.env.get('OCPP_INTERNAL_KEY')!,
              },
              body: JSON.stringify({
                chargePointId: charger.ocpp_charge_point_id,
                transactionId,
              }),
            });

            const remoteResult = await remoteStopResponse.json();
            console.log('[charger-commands] Remote stop result:', remoteResult);

            if (!remoteResult.success) {
              console.warn('[charger-commands] Remote stop failed, but still resetting charger and session to avoid stuck state');
              // Don't return error — fall through to reset charger and session
            }
          } catch (fetchError) {
            console.error('[charger-commands] OCPP API error:', fetchError);
          }
        }

        // Update session status - find by transactionId or fall back to sessionId
        const updateData = {
          status: 'completed',
          ended_at: new Date().toISOString(),
          stop_reason: 'Remote',
        };

        if (transactionId) {
          await supabaseAdmin
            .from('charging_sessions')
            .update(updateData)
            .eq('transaction_id', transactionId);
        } else {
          await supabaseAdmin
            .from('charging_sessions')
            .update(updateData)
            .eq('id', sessionId)
            .eq('user_id', userId);
        }

        // Update charger status (with error handling)
        const { error: updateError } = await supabaseAdmin
          .from('chargers')
          .update({ status: 'available' })
          .eq('id', chargerId);

        if (updateError) {
          console.error('[charger-commands] Failed to update charger status to available:', updateError);
        }

        return new Response(JSON.stringify({
          success: true,
          message: 'Charging session stopped',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'status': {
        if (!chargerId) {
          return new Response(JSON.stringify({ error: 'chargerId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: charger, error } = await supabaseAdmin
          .from('chargers')
          .select('ocpp_charge_point_id, ocpp_protocol_status, last_heartbeat, status')
          .eq('id', chargerId)
          .single();

        if (error || !charger) {
          return new Response(JSON.stringify({ error: 'Charger not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Auto-fix: if charger is "in_use" but no active sessions exist, reset to available
        if (charger.status === 'in_use') {
          const { data: activeSessions } = await supabaseAdmin
            .from('charging_sessions')
            .select('id')
            .eq('charger_id', chargerId)
            .in('status', ['in_progress', 'awaiting_plug'])
            .limit(1);

          if (!activeSessions || activeSessions.length === 0) {
            await supabaseAdmin
              .from('chargers')
              .update({ status: 'available' })
              .eq('id', chargerId);
            console.log('[charger-commands] Auto-fixed stale in_use status for charger:', chargerId);
          }
        }

        // Check if charger is connected (heartbeat within last 2 minutes)
        const lastHeartbeat = charger.last_heartbeat ? new Date(charger.last_heartbeat) : null;
        const isConnected = lastHeartbeat 
          ? (Date.now() - lastHeartbeat.getTime()) < 120000 
          : false;

        return new Response(JSON.stringify({
          chargePointId: charger.ocpp_charge_point_id,
          isConnected,
          ocppStatus: charger.ocpp_protocol_status,
          lastHeartbeat: charger.last_heartbeat,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'triggerStatus': {
        if (!chargerId) {
          return new Response(JSON.stringify({ error: 'chargerId is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { data: charger } = await supabaseAdmin
          .from('chargers')
          .select('ocpp_charge_point_id')
          .eq('id', chargerId)
          .single();

        if (!charger || !charger.ocpp_charge_point_id) {
          return new Response(JSON.stringify({ error: 'Charger not found or not registered' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!OCPP_SERVER_URL) {
          return new Response(JSON.stringify({ error: 'OCPP server not configured' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        try {
          const r = await fetch(`${OCPP_SERVER_URL}/api/trigger-message`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-internal-key': Deno.env.get('OCPP_INTERNAL_KEY')!,
            },
            body: JSON.stringify({
              chargePointId: charger.ocpp_charge_point_id,
              requestedMessage: requestedMessage || 'StatusNotification',
              connectorId: typeof connectorId === 'number' ? connectorId : 1,
            }),
          });
          const json = await r.json();
          return new Response(JSON.stringify(json), {
            status: r.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        } catch (e) {
          console.error('[charger-commands] triggerStatus error:', e);
          return new Response(JSON.stringify({ success: false, message: 'Failed to reach OCPP server' }), {
            status: 502,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('[charger-commands] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
