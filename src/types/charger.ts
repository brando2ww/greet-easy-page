// Types for charger and charging operations

export interface ChargePoint {
  id: string;
  chargePointId: string | null;  // OCPP Charge Point ID (e.g., "140414")
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  power: number;
  pricePerKwh: number;
  connectorType: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  ocppProtocolStatus: string | null;
  lastHeartbeat: string | null;
  firmwareVersion: string | null;
  ocppVendor: string | null;
  ocppModel: string | null;
  serialNumber: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface Transaction {
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
  status: 'in_progress' | 'completed' | 'cancelled';
  stopReason: string | null;
  idTag: string | null;
  vehicleInfo: string | null;
  soc: number | null;
  charger?: {
    name: string;
    location: string;
  };
}

export interface ChargerStatus {
  chargePointId: string;
  isConnected: boolean;
  ocppStatus: string | null;
  lastHeartbeat: string | null;
}

export interface RemoteCommandResponse {
  success: boolean;
  message: string;
  transactionId?: number;
  sessionId?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// Database row types (snake_case from Supabase)
export interface ChargerRow {
  id: string;
  ocpp_charge_point_id: string | null;
  name: string;
  location: string;
  latitude: number | null;
  longitude: number | null;
  power: number;
  price_per_kwh: number;
  connector_type: string;
  status: 'available' | 'in_use' | 'maintenance' | 'offline';
  ocpp_protocol_status: string | null;
  last_heartbeat: string | null;
  firmware_version: string | null;
  ocpp_vendor: string | null;
  ocpp_model: string | null;
  serial_number: string | null;
  ocpp_error_code: string | null;
  client_id: string | null;
  partner_client_id: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface ChargingSessionRow {
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
  soc: number | null;
  created_at: string;
  updated_at: string;
}

// Mappers
export function mapChargerRowToChargePoint(row: ChargerRow): ChargePoint {
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

export function mapSessionRowToTransaction(row: ChargingSessionRow & { chargers?: { name: string; location: string } }): Transaction {
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
    status: row.status as 'in_progress' | 'completed' | 'cancelled',
    stopReason: row.stop_reason,
    idTag: row.id_tag,
    vehicleInfo: row.vehicle_info,
    soc: row.soc,
    charger: row.chargers ? {
      name: row.chargers.name,
      location: row.chargers.location,
    } : undefined,
  };
}
