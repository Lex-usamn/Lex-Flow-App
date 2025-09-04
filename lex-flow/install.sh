#!/bin/bash

# Script de Instalação do Lex Flow para Ubuntu 22.04
# Versão: 2.0.0

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                    LEX FLOW INSTALLER                        ║
║                  Produtividade Pessoal                       ║
║                      Versão 2.0.0                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar se é Ubuntu 22.04
if ! grep -q "Ubuntu 22.04" /etc/os-release; then
    warn "Este script foi testado apenas no Ubuntu 22.04. Continuando mesmo assim..."
fi

# Verificar se é executado como root
if [[ $EUID -eq 0 ]]; then
   error "Este script não deve ser executado como root. Use um usuário normal com sudo."
fi

# Verificar se tem sudo
if ! sudo -n true 2>/dev/null; then
    error "Este script requer privilégios sudo. Execute: sudo -v"
fi

log "Iniciando instalação do Lex Flow..."

# Atualizar sistema
log "Atualizando sistema..."
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
log "Instalando dependências básicas..."
sudo apt install -y curl wget git build-essential software-properties-common apt-transport-https ca-certificates gnupg lsb-release rsync

# Instalar Node.js 20.x
log "Instalando Node.js 20.x..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
else
    log "Node.js já está instalado: $(node --version)"
fi

# Verificar versão do Node.js
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    error "Node.js versão 18+ é necessário. Versão atual: $(node --version)"
fi

# Instalar pnpm
log "Instalando pnpm..."
if ! command -v pnpm &> /dev/null; then
    npm install -g pnpm
else
    log "pnpm já está instalado: $(pnpm --version)"
fi

# Instalar Nginx (opcional para produção)
log "Instalando Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
else
    log "Nginx já está instalado"
fi

# Instalar PM2 para gerenciamento de processos
log "Instalando PM2..."
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
    pm2 startup
else
    log "PM2 já está instalado: $(pm2 --version)"
fi

# Criar diretório da aplicação
APP_DIR="/opt/lex-flow"
log "Criando diretório da aplicação: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Obter diretório atual do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
log "Diretório do script: $SCRIPT_DIR"

# Copiar arquivos da aplicação
log "Copiando arquivos da aplicação..."
# Verificar se estamos no diretório correto
if [ ! -f "$SCRIPT_DIR/package.json" ]; then
    error "Arquivo package.json não encontrado em $SCRIPT_DIR. Certifique-se de executar o script no diretório correto."
fi

# Copiar todos os arquivos exceto o diretório de destino
rsync -av --exclude="/opt/lex-flow" "$SCRIPT_DIR/" "$APP_DIR/"
cd $APP_DIR

# Verificar se o package.json foi copiado
if [ ! -f "$APP_DIR/package.json" ]; then
    error "Falha ao copiar package.json para $APP_DIR"
fi

log "Arquivos copiados com sucesso. Verificando estrutura..."
ls -la $APP_DIR/

# Instalar dependências do projeto
log "Instalando dependências do projeto..."
pnpm install

# Fazer build da aplicação
log "Fazendo build da aplicação..."
pnpm run build

# Criar arquivo de configuração do Nginx
log "Configurando Nginx..."
sudo tee /etc/nginx/sites-available/lex-flow > /dev/null << EOF
server {
    listen 80;
    server_name localhost;
    root $APP_DIR/dist;
    index index.html;

    # Configurações para PWA
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Headers para PWA
        add_header Cache-Control "public, max-age=31536000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Service Worker
    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Manifest
    location /manifest.json {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
EOF

# Ativar site no Nginx
sudo ln -sf /etc/nginx/sites-available/lex-flow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Testar configuração do Nginx
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx

# Criar script de inicialização
log "Criando script de inicialização..."
tee $APP_DIR/start.sh > /dev/null << EOF
#!/bin/bash
cd $APP_DIR
pnpm run preview --host 0.0.0.0 --port 3000
EOF

chmod +x $APP_DIR/start.sh

# Criar arquivo de configuração do PM2
log "Criando configuração do PM2..."
tee $APP_DIR/ecosystem.config.js > /dev/null << EOF
module.exports = {
  apps: [{
    name: 'lex-flow',
    script: './start.sh',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Criar serviço systemd
log "Criando serviço systemd..."
sudo tee /etc/systemd/system/lex-flow.service > /dev/null << EOF
[Unit]
Description=Lex Flow - Aplicativo de Produtividade Pessoal
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pnpm run preview --host 0.0.0.0 --port 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
EOF

# Recarregar systemd e habilitar serviço
sudo systemctl daemon-reload
sudo systemctl enable lex-flow

# Criar script de backup
log "Criando script de backup..."
tee $APP_DIR/backup.sh > /dev/null << EOF
#!/bin/bash
# Script de Backup do Lex Flow

BACKUP_DIR="/opt/lex-flow-backups"
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="lex-flow-backup-\$DATE.tar.gz"

mkdir -p \$BACKUP_DIR

# Fazer backup da aplicação
tar -czf \$BACKUP_DIR/\$BACKUP_FILE -C /opt lex-flow

# Manter apenas os últimos 10 backups
cd \$BACKUP_DIR
ls -t lex-flow-backup-*.tar.gz | tail -n +11 | xargs -r rm

echo "Backup criado: \$BACKUP_DIR/\$BACKUP_FILE"
EOF

chmod +x $APP_DIR/backup.sh

# Criar cron job para backup diário
log "Configurando backup automático..."
(crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh") | crontab -

# Configurar firewall
log "Configurando firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
fi

# Criar arquivo de informações do sistema
log "Criando arquivo de informações..."
tee $APP_DIR/SYSTEM_INFO.txt > /dev/null << EOF
LEX FLOW - INFORMAÇÕES DO SISTEMA
================================

Data de Instalação: $(date)
Versão do Sistema: $(lsb_release -d | cut -f2)
Versão do Node.js: $(node --version)
Versão do pnpm: $(pnpm --version)
Versão do Nginx: $(nginx -v 2>&1 | cut -d' ' -f3)

Diretórios:
- Aplicação: $APP_DIR
- Backups: /opt/lex-flow-backups
- Logs Nginx: /var/log/nginx/
- Configuração Nginx: /etc/nginx/sites-available/lex-flow

Comandos Úteis:
- Iniciar aplicação: sudo systemctl start lex-flow
- Parar aplicação: sudo systemctl stop lex-flow
- Status da aplicação: sudo systemctl status lex-flow
- Logs da aplicação: journalctl -u lex-flow -f
- Reiniciar Nginx: sudo systemctl restart nginx
- Fazer backup: $APP_DIR/backup.sh

URLs:
- Aplicação: http://localhost
- Aplicação (porta 3000): http://localhost:3000

Arquivos de Configuração:
- Nginx: /etc/nginx/sites-available/lex-flow
- Systemd: /etc/systemd/system/lex-flow.service
- PM2: $APP_DIR/ecosystem.config.js
EOF

# Iniciar aplicação
log "Iniciando aplicação..."
sudo systemctl start lex-flow

# Aguardar alguns segundos
sleep 5

# Verificar status
if sudo systemctl is-active --quiet lex-flow; then
    log "✅ Aplicação iniciada com sucesso!"
else
    warn "⚠️  Aplicação pode não ter iniciado corretamente. Verifique os logs:"
    echo "   journalctl -u lex-flow -f"
fi

# Verificar Nginx
if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx está funcionando!"
else
    warn "⚠️  Nginx pode não estar funcionando corretamente."
fi

# Teste de conectividade
log "Testando conectividade..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost | grep -q "200"; then
    log "✅ Aplicação acessível em http://localhost"
else
    warn "⚠️  Aplicação pode não estar acessível. Verifique a configuração."
fi

# Informações finais
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    INSTALAÇÃO CONCLUÍDA!                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"

echo -e "${BLUE}🚀 Lex Flow foi instalado com sucesso!${NC}\n"

echo -e "${YELLOW}📍 URLs de Acesso:${NC}"
echo -e "   • Principal: ${GREEN}http://localhost${NC}"
echo -e "   • Alternativa: ${GREEN}http://localhost:3000${NC}"
echo -e "   • IP Local: ${GREEN}http://$(hostname -I | awk '{print $1}')${NC}\n"

echo -e "${YELLOW}🔧 Comandos Úteis:${NC}"
echo -e "   • Status: ${GREEN}sudo systemctl status lex-flow${NC}"
echo -e "   • Logs: ${GREEN}journalctl -u lex-flow -f${NC}"
echo -e "   • Backup: ${GREEN}$APP_DIR/backup.sh${NC}"
echo -e "   • Reiniciar: ${GREEN}sudo systemctl restart lex-flow${NC}\n"

echo -e "${YELLOW}📁 Arquivos Importantes:${NC}"
echo -e "   • Aplicação: ${GREEN}$APP_DIR${NC}"
echo -e "   • Informações: ${GREEN}$APP_DIR/SYSTEM_INFO.txt${NC}"
echo -e "   • Backups: ${GREEN}/opt/lex-flow-backups${NC}\n"

echo -e "${BLUE}💡 Dicas:${NC}"
echo -e "   • O backup automático está configurado para rodar diariamente às 2h"
echo -e "   • A aplicação reinicia automaticamente em caso de falha"
echo -e "   • Use Ctrl+C para sair dos logs em tempo real\n"

log "Instalação finalizada! Aproveite o Lex Flow! 🎉"

