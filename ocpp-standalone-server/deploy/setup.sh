#!/bin/bash
# Setup script for OCPP server on Digital Ocean Droplet
# Run as root: bash setup.sh

set -e

echo "=== Installing Node.js 20 ==="
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs git

echo "=== Cloning repository ==="
if [ ! -d "/opt/ocpp-server" ]; then
  git clone https://github.com/AgnusSOCO/greet-easy-page-production.git /opt/ocpp-server
else
  cd /opt/ocpp-server && git pull
fi

echo "=== Installing dependencies ==="
cd /opt/ocpp-server/ocpp-standalone-server
npm install --production

echo "=== Creating .env file ==="
if [ ! -f "/opt/ocpp-server/.env" ]; then
  cat > /opt/ocpp-server/.env << EOF
SUPABASE_URL=https://fgvjvtglcmxzadetmmoi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=COLE_SUA_CHAVE_AQUI
PORT=80
EOF
  echo "IMPORTANTE: Edite /opt/ocpp-server/.env e coloque sua SUPABASE_SERVICE_ROLE_KEY"
fi

echo "=== Installing systemd service ==="
cp /opt/ocpp-server/ocpp-standalone-server/deploy/ocpp-server.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable ocpp-server

echo "=== Configuring firewall ==="
ufw allow 80/tcp
ufw --force enable

echo "=== Starting server ==="
systemctl start ocpp-server
systemctl status ocpp-server

echo ""
echo "=== DONE ==="
echo "Server running on port 80"
echo "Check logs: journalctl -u ocpp-server -f"
echo "Configure charger URL: ws://$(curl -s ifconfig.me):80/ocpp"
