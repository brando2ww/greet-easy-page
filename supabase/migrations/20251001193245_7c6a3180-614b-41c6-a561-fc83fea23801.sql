-- Atualizar conectores existentes de AC para Type 2 (padrão europeu mais comum para AC)
UPDATE chargers 
SET connector_type = 'Type 2'
WHERE connector_type = 'AC';

-- Adicionar comentário na coluna para orientar futuros usos
COMMENT ON COLUMN chargers.connector_type IS 'Tipo de conector físico: Type 1, Type 2, CCS, CHAdeMO, Tesla, etc.';