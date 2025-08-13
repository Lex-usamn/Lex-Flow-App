#!/bin/bash

# Script de Instalação do Lex Flow para Ubuntu 22.04 - Versão Debug
# Versão: 2.0.1

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

debug() {
    echo -e "${BLUE}[DEBUG]${NC} $1"
}

# Banner
echo -e "${BLUE}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                LEX FLOW INSTALLER - DEBUG                    ║
║                  Produtividade Pessoal                       ║
║                      Versão 2.0.1                           ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Verificar diretório atual
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
debug "Diretório do script: $SCRIPT_DIR"
debug "Arquivos no diretório atual:"
ls -la "$SCRIPT_DIR"

# Verificar arquivos essenciais
debug "Verificando arquivos essenciais..."
REQUIRED_FILES=("package.json" "index.html" "src" "public")
MISSING_FILES=()

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -e "$SCRIPT_DIR/$file" ]; then
        MISSING_FILES+=("$file")
    else
        debug "✓ $file encontrado"
    fi
done

if [ ${#MISSING_FILES[@]} -ne 0 ]; then
    error "Arquivos essenciais não encontrados: ${MISSING_FILES[*]}"
fi

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

debug "Verificando permissões do diretório de destino:"
ls -ld $APP_DIR

# Copiar arquivos da aplicação
log "Copiando arquivos da aplicação..."
debug "Copiando de: $SCRIPT_DIR"
debug "Para: $APP_DIR"

# Usar cp com verbose para debug
cp -rv "$SCRIPT_DIR"/* "$APP_DIR/" 2>&1 | head -20
debug "Primeiros 20 arquivos copiados mostrados acima..."

cd $APP_DIR

# Verificar se o package.json foi copiado
debug "Verificando arquivos copiados:"
ls -la $APP_DIR/ | head -10

if [ ! -f "$APP_DIR/package.json" ]; then
    error "Falha ao copiar package.json para $APP_DIR"
fi

debug "Conteúdo do package.json:"
head -10 "$APP_DIR/package.json"

# Instalar dependências do projeto
log "Instalando dependências do projeto..."
debug "Executando: pnpm install no diretório $APP_DIR"
pnpm install --verbose

# Fazer build da aplicação
log "Fazendo build da aplicação..."
debug "Executando: pnpm run build"
pnpm run build

debug "Verificando se o build foi criado:"
ls -la $APP_DIR/dist/ | head -10

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
debug "Testando configuração do Nginx:"
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

# Configurar firewall
log "Configurando firewall..."
if command -v ufw &> /dev/null; then
    sudo ufw allow 22/tcp
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw --force enable
fi

# Iniciar aplicação
log "Iniciando aplicação..."
sudo systemctl start lex-flow

# Aguardar alguns segundos
sleep 5

# Verificar status
debug "Verificando status dos serviços:"
debug "Status do lex-flow:"
sudo systemctl status lex-flow --no-pager -l

debug "Status do nginx:"
sudo systemctl status nginx --no-pager -l

if sudo systemctl is-active --quiet lex-flow; then
    log "✅ Aplicação iniciada com sucesso!"
else
    warn "⚠️  Aplicação pode não ter iniciado corretamente. Logs:"
    journalctl -u lex-flow --no-pager -l | tail -20
fi

# Verificar Nginx
if sudo systemctl is-active --quiet nginx; then
    log "✅ Nginx está funcionando!"
else
    warn "⚠️  Nginx pode não estar funcionando corretamente."
fi

# Teste de conectividade
log "Testando conectividade..."
debug "Testando http://localhost..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost || echo "000")
debug "Código HTTP retornado: $HTTP_CODE"

if [ "$HTTP_CODE" = "200" ]; then
    log "✅ Aplicação acessível em http://localhost"
else
    warn "⚠️  Aplicação pode não estar acessível. Código HTTP: $HTTP_CODE"
    debug "Testando porta 3000 diretamente..."
    HTTP_CODE_3000=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "000")
    debug "Código HTTP porta 3000: $HTTP_CODE_3000"
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

echo -e "${YELLOW}🔧 Comandos de Debug:${NC}"
echo -e "   • Status: ${GREEN}sudo systemctl status lex-flow${NC}"
echo -e "   • Logs: ${GREEN}journalctl -u lex-flow -f${NC}"
echo -e "   • Teste manual: ${GREEN}cd $APP_DIR && pnpm run preview${NC}"
echo -e "   • Verificar arquivos: ${GREEN}ls -la $APP_DIR${NC}\n"

log "Instalação finalizada! Se houver problemas, use os comandos de debug acima. 🎉"

