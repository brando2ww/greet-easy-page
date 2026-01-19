import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ChargerRow {
  id: string;
  ocpp_charge_point_id: string | null;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  power: number;
  price_per_kwh: number;
  connector_type: string;
  status: string;
  ocpp_protocol_status: string | null;
  last_heartbeat: string | null;
  firmware_version: string | null;
  ocpp_vendor: string | null;
  ocpp_model: string | null;
  serial_number: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface ChargePoint {
  id: string;
  chargePointId: string | null;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  power: number;
  pricePerKwh: number;
  connectorType: string;
  status: string;
  ocppProtocolStatus: string | null;
  lastHeartbeat: string | null;
  firmwareVersion: string | null;
  ocppVendor: string | null;
  ocppModel: string | null;
  serialNumber: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

function mapRowToChargePoint(row: ChargerRow): ChargePoint {
  return {
    id: row.id,
    chargePointId: row.ocpp_charge_point_id,
    name: row.name,
    location: row.location,
    latitude: row.latitude,
    longitude: row.longitude,
    power: row.power,
    pricePerKwh: row.price_per_kwh,
    connectorType: row.connector_type,
    status: row.status,
    ocppProtocolStatus: row.ocpp_protocol_status,
    lastHeartbeat: row.last_heartbeat,
    firmwareVersion: row.firmware_version,
    ocppVendor: row.ocpp_vendor,
    ocppModel: row.ocpp_model,
    serialNumber: row.serial_number,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapChargePointToRow(cp: Partial<ChargePoint>): Partial<ChargerRow> {
  const row: Partial<ChargerRow> = {};
  if (cp.chargePointId !== undefined) row.ocpp_charge_point_id = cp.chargePointId;
  if (cp.name !== undefined) row.name = cp.name;
  if (cp.location !== undefined) row.location = cp.location;
  if (cp.latitude !== undefined) row.latitude = cp.latitude;
  if (cp.longitude !== undefined) row.longitude = cp.longitude;
  if (cp.power !== undefined) row.power = cp.power;
  if (cp.pricePerKwh !== undefined) row.price_per_kwh = cp.pricePerKwh;
  if (cp.connectorType !== undefined) row.connector_type = cp.connectorType;
  if (cp.status !== undefined) row.status = cp.status;
  if (cp.serialNumber !== undefined) row.serial_number = cp.serialNumber;
  return row;
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

    const body = await req.json();
    const { action, id, code, ...data } = body;

    console.log(`[chargers-api] Action: ${action}, User: ${userId}, Admin: ${isAdmin}`);

    switch (action) {
      case 'list': {
        const { data: chargers, error } = await supabaseAdmin
          .from('chargers')
          .select('*')
          .order('name');

        if (error) throw error;

        const mapped = (chargers as ChargerRow[]).map(mapRowToChargePoint);
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

        const { data: charger, error } = await supabaseAdmin
          .from('chargers')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(mapRowToChargePoint(charger)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'getByCode': {
        if (!code) {
          return new Response(JSON.stringify({ error: 'Code is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Try to find by UUID or OCPP charge point ID
        const { data: charger, error } = await supabaseAdmin
          .from('chargers')
          .select('*')
          .or(`id.eq.${code},ocpp_charge_point_id.eq.${code}`)
          .maybeSingle();

        if (error) throw error;

        if (!charger) {
          return new Response(JSON.stringify({ error: 'Charger not found' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify(mapRowToChargePoint(charger)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'create': {
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const rowData = mapChargePointToRow(data);
        const { data: charger, error } = await supabaseAdmin
          .from('chargers')
          .insert(rowData)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(mapRowToChargePoint(charger)), {
          status: 201,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const rowData = mapChargePointToRow(data);
        const { data: charger, error } = await supabaseAdmin
          .from('chargers')
          .update(rowData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        return new Response(JSON.stringify(mapRowToChargePoint(charger)), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        if (!isAdmin) {
          return new Response(JSON.stringify({ error: 'Admin access required' }), {
            status: 403,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (!id) {
          return new Response(JSON.stringify({ error: 'ID is required' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error } = await supabaseAdmin
          .from('chargers')
          .delete()
          .eq('id', id);

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
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
    console.error('[chargers-api] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
