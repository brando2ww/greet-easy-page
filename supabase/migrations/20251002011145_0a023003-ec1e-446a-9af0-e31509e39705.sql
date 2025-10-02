-- Adicionar campos OCPP na tabela chargers
ALTER TABLE public.chargers 
  ADD COLUMN ocpp_charge_point_id TEXT UNIQUE,
  ADD COLUMN last_heartbeat TIMESTAMPTZ,
  ADD COLUMN firmware_version TEXT,
  ADD COLUMN ocpp_protocol_status TEXT DEFAULT 'Offline',
  ADD COLUMN ocpp_error_code TEXT,
  ADD COLUMN ocpp_vendor TEXT,
  ADD COLUMN ocpp_model TEXT;

-- Criar índice para melhor performance
CREATE INDEX idx_chargers_ocpp_charge_point_id ON public.chargers(ocpp_charge_point_id);

-- Comentários para documentação
COMMENT ON COLUMN public.chargers.ocpp_charge_point_id IS 'Identificador único do carregador no protocolo OCPP 1.6J';
COMMENT ON COLUMN public.chargers.last_heartbeat IS 'Timestamp do último heartbeat recebido via OCPP';
COMMENT ON COLUMN public.chargers.ocpp_protocol_status IS 'Status OCPP: Available, Preparing, Charging, SuspendedEV, SuspendedEVSE, Finishing, Reserved, Unavailable, Faulted, Offline';
COMMENT ON COLUMN public.chargers.ocpp_error_code IS 'Código de erro OCPP se status = Faulted';

-- Adicionar campos OCPP na tabela charging_sessions
ALTER TABLE public.charging_sessions 
  ADD COLUMN transaction_id INTEGER UNIQUE,
  ADD COLUMN meter_start INTEGER,
  ADD COLUMN meter_stop INTEGER,
  ADD COLUMN id_tag TEXT,
  ADD COLUMN stop_reason TEXT;

-- Criar índice
CREATE INDEX idx_charging_sessions_transaction_id ON public.charging_sessions(transaction_id);

-- Comentários
COMMENT ON COLUMN public.charging_sessions.transaction_id IS 'ID único da transação OCPP';
COMMENT ON COLUMN public.charging_sessions.meter_start IS 'Leitura inicial do medidor em Wh';
COMMENT ON COLUMN public.charging_sessions.meter_stop IS 'Leitura final do medidor em Wh';
COMMENT ON COLUMN public.charging_sessions.id_tag IS 'Tag RFID ou ID de autorização';
COMMENT ON COLUMN public.charging_sessions.stop_reason IS 'Motivo do término (Local, Remote, EmergencyStop, EVDisconnected, etc)';