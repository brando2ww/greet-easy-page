

# Migrar servidor OCPP para aceitar conexoes ws:// (sem SSL)

## Problema

O carregador Zeta Uno so suporta conexoes `ws://` (WebSocket sem SSL/TLS). O Digital Ocean App Platform forca todas as conexoes para HTTPS/WSS, rejeitando conexoes `ws://` antes de chegarem ao servidor Node.js. Por isso, o charger conecta no WiFi (indicador verde) mas o OCPP fica vermelho -- a conexao nunca chega ao servidor.

## Solucao

Migrar o servidor OCPP do Digital Ocean App Platform para um **Digital Ocean Droplet** (VPS), que permite aceitar conexoes `ws://` diretamente na porta desejada (ex: 80 ou 8080).

## Passos

### 1. Criar um Droplet no Digital Ocean

- Imagem: Ubuntu 24.04
- Plano: Basic ($6/mes, 1 vCPU, 1GB RAM -- suficiente para OCPP)
- Regiao: mesma do App Platform atual (para menor latencia)
- Habilitar IPv4 publico

### 2. Configurar o Droplet

Acessar via SSH e instalar Node.js:

```text
ssh root@IP_DO_DROPLET
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
```

### 3. Clonar e configurar o servidor

```text
git clone https://github.com/SEU_REPO.git /opt/ocpp-server
cd /opt/ocpp-server/ocpp-standalone-server
npm install
```

Criar arquivo de variaveis de ambiente:

```text
cat > /opt/ocpp-server/.env << EOF
SUPABASE_URL=https://fgvjvtglcmxzadetmmoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=sua_chave_aqui
PORT=80
EOF
```

### 4. Configurar como servico systemd

Criar `/etc/systemd/system/ocpp-server.service` para o servidor iniciar automaticamente e reiniciar em caso de falha.

### 5. Abrir porta no firewall

```text
ufw allow 80/tcp
```

### 6. Configurar o Zeta Uno

No app do Zeta Uno, configurar:
- **Endereco do Servidor OCPP**: `ws://IP_DO_DROPLET:80/ocpp`
- **ID do Carregador**: `140414`

### 7. (Opcional) Configurar dominio

Apontar um subdominio como `ocpp.seudominio.com` para o IP do Droplet via DNS A record. Assim a URL ficaria `ws://ocpp.seudominio.com/ocpp`.

## Alternativa: Usar porta 80 no servidor atual

Isso **nao funciona** no App Platform porque ele intercepta todas as conexoes HTTP/WS e forca upgrade para HTTPS/WSS. O Droplet e a unica opcao no Digital Ocean que permite `ws://` direto.

## Nenhuma alteracao no codigo

O arquivo `server.js` nao precisa de mudancas. Basta alterar a variavel `PORT` para 80 no ambiente do Droplet. O servidor ja aceita conexoes `ws://` nativamente -- o problema era apenas a camada de proxy SSL do App Platform.

## Resultado esperado

1. Droplet rodando o servidor OCPP na porta 80
2. Zeta Uno conecta via `ws://IP_DO_DROPLET:80/ocpp/140414`
3. WiFi verde + OCPP verde no app do charger
4. BootNotification aparece nos logs do servidor

