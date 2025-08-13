#!/bin/bash

# Lex Flow 2.0 - Script de Instalação para Ubuntu 22.04
# Versão: 2.2.0 (Corrigido e Otimizado para Produção)
# Data: $(date)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configurações
APP_NAME="lex-flow"
APP_DIR="/opt/lex-flow"
BACKEND_DIR="/opt/lex-flow-backend"
SERVICE_USER="lexflow"
FRONTEND_PORT="3000"
BACKEND_PORT="5000"
DATABASE_URL="sqlite:///${BACKEND_DIR}/database/app.db" # ### CORREÇÃO: Variável centralizada

# ... (Funções de log, check_root, etc., permanecem as mesmas) ...
log() { echo -e "${GREEN}[INFO]${NC} $1"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }
check_root() { if [[ $EUID -ne 0 ]]; then error "Este script deve ser executado como root (use sudo)"; fi; }
check_ubuntu_version() {
    if ! grep -q "Ubuntu 22.04" /etc/os-release; then
        warn "Este script foi testado no Ubuntu 22.04. Outras versões podem não funcionar."
        read -p "Deseja continuar mesmo assim? (y/N): " -n 1 -r; echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then exit 1; fi
    fi
}
install_system_dependencies() {
    log "Atualizando e instalando dependências do sistema..."
    apt update
    apt install -y curl wget git build-essential python3 python3-pip python3-venv nginx supervisor ufw rsync unzip
    log "Dependências do sistema instaladas!"
}
install_nodejs() {
    log "Instalando Node.js 20 e pnpm..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    npm install -g pnpm
    log "Node.js e pnpm instalados!"
}
create_system_user() {
    log "Criando usuário do sistema: $SERVICE_USER"
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd --system --shell /bin/bash --home-dir /home/$SERVICE_USER --create-home $SERVICE_USER
    else
        log "Usuário $SERVICE_USER já existe."
    fi
}
install_frontend() {
    log "Instalando frontend do Lex Flow..."
    mkdir -p $APP_DIR
    if [[ ! -f "package.json" ]]; then error "Arquivo package.json não encontrado."; fi
    rsync -av --exclude=node_modules --exclude=dist --exclude=.git . $APP_DIR/
    chown -R $SERVICE_USER:$SERVICE_USER $APP_DIR
    cd $APP_DIR
    sudo -u $SERVICE_USER pnpm install
    sudo -u $SERVICE_USER pnpm run build
    log "Frontend instalado com sucesso!"
}
# ... (fim das funções que não mudaram) ...

### CORREÇÃO: FUNÇÕES REESTRUTURADAS ###

install_backend() {
    log "Instalando arquivos do backend..."
    read -e -p "Por favor, insira o caminho completo para a pasta do backend: " BACKEND_SOURCE_DIR
    while [[ ! -d "$BACKEND_SOURCE_DIR" ]]; do
        read -e -p "Diretório não encontrado. Tente novamente: " BACKEND_SOURCE_DIR
    done

    mkdir -p "$BACKEND_DIR"
    rsync -av --exclude=venv --exclude=__pycache__ --exclude=.git --exclude='database/*' --exclude='migrations/*' "$BACKEND_SOURCE_DIR/" "$BACKEND_DIR/"
    chown -R $SERVICE_USER:$SERVICE_USER "$BACKEND_DIR"

    log "Criando diretório do banco de dados..."
    sudo -u $SERVICE_USER mkdir -p "$BACKEND_DIR/database"

    ### CORREÇÃO DE ROBUSTEZ NA INSTALAÇÃO PYTHON ###
    log "Criando ambiente virtual Python..."
    sudo -u $SERVICE_USER -H python3 -m venv "$BACKEND_DIR/venv"

    log "Atualizando PIP no novo ambiente virtual..."
    sudo -u $SERVICE_USER -H "$BACKEND_DIR/venv/bin/pip" install --upgrade pip

    log "Instalando Gunicorn..."
    sudo -u $SERVICE_USER -H "$BACKEND_DIR/venv/bin/pip" install gunicorn

    if [[ -f "$BACKEND_DIR/requirements.txt" ]]; then
        log "Instalando dependências de requirements.txt..."
        if sudo -u $SERVICE_USER -H "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"; then
            log "Dependências do backend instaladas com sucesso."
        else
            error "FALHA ao instalar dependências de requirements.txt. Verifique os erros de 'pip' acima."
        fi
    else
        warn "Arquivo requirements.txt não encontrado em $BACKEND_DIR."
    fi
    
    log "Arquivos e dependências do backend instalados com sucesso!"
}

setup_environment_file() {
    log "Configurando o arquivo de ambiente (.env)..."
    local SECRET_KEY
    SECRET_KEY=$(openssl rand -hex 32)
    local OPENAI_KEY=""
    local GEMINI_KEY=""

    read -p "Por favor, insira sua OpenAI API Key: " OPENAI_KEY
    read -p "Agora, insira sua Google Gemini API Key: " GEMINI_KEY

    cat > "$BACKEND_DIR/.env" << EOF
# Arquivo de ambiente gerado automaticamente pelo script de instalação
SECRET_KEY=${SECRET_KEY}
DATABASE_URL=${DATABASE_URL}
OPENAI_API_KEY=${OPENAI_KEY}
GEMINI_API_KEY=${GEMINI_KEY}
EOF

    chown $SERVICE_USER:$SERVICE_USER "$BACKEND_DIR/.env"
    log "Arquivo .env criado com sucesso em $BACKEND_DIR/.env"
}

setup_database() {
    log "Inicializando e migrando o banco de dados..."
    sudo -u $SERVICE_USER -H -- /bin/bash -c "
        set -e
        cd $BACKEND_DIR
        source venv/bin/activate
        export FLASK_APP=src.main:create_app

        flask db init
        flask db migrate -m 'Initial database structure'
        flask db upgrade
    "
    log "Banco de dados configurado com sucesso!"
}

configure_supervisor() {
    log "Configurando Supervisor para o backend..."
    cat > /etc/supervisor/conf.d/lex-flow-backend.conf << EOF
[program:lex-flow-backend]
command=/opt/lex-flow-backend/venv/bin/dotenv run -- /opt/lex-flow-backend/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 --chdir /opt/lex-flow-backend --log-file - 'src.main:app'
#command=/opt/lex-flow-backend/venv/bin/gunicorn --workers 3 --bind 0.0.0.0:5000 --chdir /opt/lex-flow-backend src.main:app
directory=/opt/lex-flow-backend
user=$SERVICE_USER
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/lex-flow-backend.log
### CORREÇÃO: Injeta a DATABASE_URL diretamente no ambiente do processo ###
environment=FLASK_ENV=production,FLASK_APP='src.main:create_app',DATABASE_URL='${DATABASE_URL}'
EOF

    supervisorctl reread
    supervisorctl update
    supervisorctl start lex-flow-backend
    log "Supervisor configurado com sucesso!"
}

# ... (Função configure_nginx e outras não precisam de grandes mudanças) ...
configure_nginx() { log "Configurando Nginx..."; rm -f /etc/nginx/sites-enabled/default; cat > /etc/nginx/sites-available/lex-flow << EOF
server {
    listen 80;
    server_name localhost _;
    location /assets/ { alias $APP_DIR/dist/assets/; expires 1y; add_header Cache-Control "public, immutable"; }
    location / { root $APP_DIR/dist; try_files \$uri \$uri/ /index.html; }
    location /api/ { proxy_pass http://127.0.0.1:$BACKEND_PORT; proxy_set_header Host \$host; proxy_set_header X-Real-IP \$remote_addr; proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; proxy_set_header X-Forwarded-Proto \$scheme; }
    location /socket.io/ { proxy_pass http://127.0.0.1:$BACKEND_PORT; proxy_http_version 1.1; proxy_set_header Upgrade \$http_upgrade; proxy_set_header Connection "upgrade"; proxy_set_header Host \$host; }
}
EOF
ln -sf /etc/nginx/sites-available/lex-flow /etc/nginx/sites-enabled/; if nginx -t; then systemctl restart nginx; systemctl enable nginx; log "Nginx configurado!"; else error "Falha na configuração do Nginx."; fi; }
configure_firewall() { log "Configurando firewall..."; ufw allow ssh; ufw allow http; ufw allow https; ufw --force enable; log "Firewall configurado!"; }
# ... (Scripts de update/uninstall podem permanecer como estão) ...

show_final_info() {
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}  Lex Flow instalado com sucesso!       ${NC}"
    echo -e "${GREEN}========================================${NC}\n"
    echo -e "${BLUE}🌐 Acesso:${NC} http://SEU_IP_OU_DOMINIO"
    echo -e "${BLUE}📁 Diretórios:${NC}"
    echo -e "   Frontend: $APP_DIR"
    echo -e "   Backend: $BACKEND_DIR"
    echo -e "${GREEN}O arquivo de ambiente .env foi criado automaticamente.${NC}"
    echo -e "\n${BLUE}🔧 Comandos úteis:${NC}"
    echo -e "   Atualizar: sudo lex-flow-update"
    echo -e "   Desinstalar: sudo lex-flow-uninstall"
    echo -e "   Status Backend: sudo supervisorctl status lex-flow-backend"
    echo -e "   Logs Backend: sudo tail -f /var/log/lex-flow-backend.log\n"
}

main() {
    echo -e "${BLUE}Iniciando instalação do Lex Flow 2.0...${NC}"

    check_root
    check_ubuntu_version
    
    # 1. Instalação de pacotes e setup do sistema
    install_system_dependencies
    install_nodejs
    create_system_user
    
    # 2. Setup do Frontend
    install_frontend
    
    ### CORREÇÃO: ORDEM LÓGICA DE INSTALAÇÃO DO BACKEND ###
    # 3. Copia arquivos do backend e instala dependências Python
    install_backend
    
    # 4. Cria o arquivo .env com input do usuário
    setup_environment_file
    
    # 5. Configura o banco de dados (agora que .env existe)
    setup_database
    
    # 6. Configura Nginx e Supervisor (agora que tudo está pronto)
    configure_nginx
    configure_supervisor # Esta função agora está robusta
    
    # 7. Passos finais
    configure_firewall
    # create_update_script e create_uninstall_script podem ser adicionados aqui se desejar
    
    show_final_info
}

# Executar instalação
main "$@"