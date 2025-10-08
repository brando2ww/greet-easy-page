# OCPP Standalone Server

Servidor WebSocket standalone para protocolo OCPP 1.6J, compatível com estações de carregamento EV.

## Requisitos

- Node.js >= 18.0.0
- Conta Supabase configurada

## Variáveis de Ambiente

Configure as seguintes variáveis de ambiente:

```bash
SUPABASE_URL=https://fgvjvtglcmxzadetmmoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
PORT=8080  # Opcional, Railway define automaticamente
```

## Instalação Local

```bash
npm install
npm start
```

## Deploy no Railway

### 1. Fazer commit do código no GitHub

```bash
git add ocpp-standalone-server/
git commit -m "Add standalone OCPP server"
git push origin main
```

### 2. Criar novo serviço no Railway

1. Acesse [railway.app](https://railway.app)
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório **greet-easy-page-production**
5. Configure o serviço:
   - **Root Directory**: `ocpp-standalone-server`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Configurar variáveis de ambiente no Railway

No dashboard do serviço, vá em **Variables** e adicione:

```
SUPABASE_URL=https://fgvjvtglcmxzadetmmoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role_aqui
```

### 4. Deploy automático

O Railway fará o deploy automaticamente. Após concluído, você receberá uma URL como:

```
wss://ocpp-server-production.up.railway.app
```

### 5. Configurar carregadores

Os carregadores devem se conectar usando o formato:

```
wss://ocpp-server-production.up.railway.app/{chargePointId}
```

Onde `{chargePointId}` é o valor do campo `ocpp_charge_point_id` na tabela `chargers` do Supabase.

## Logs

Para ver os logs no Railway:
1. Acesse o serviço no dashboard
2. Clique na aba **"Logs"**
3. Monitore as conexões e mensagens OCPP em tempo real

## Troubleshooting

- **Erro de conexão**: Verifique se o `chargePointId` está registrado no Supabase
- **Database error**: Confirme se a `SUPABASE_SERVICE_ROLE_KEY` está correta
- **WebSocket closed**: Verifique os logs para identificar o motivo do fechamento
