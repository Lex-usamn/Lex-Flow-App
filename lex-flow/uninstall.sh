#!/bin/bash

# Script de Desinstalação do Lex Flow
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
}

# Banner
echo -e "${RED}"
cat << "EOF"
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║                   LEX FLOW UNINSTALLER                       ║
║                  Remoção Completa do Sistema                 ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
EOF
echo -e "${NC}"

# Confirmação
echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá remover completamente o Lex Flow do sistema.${NC}"
echo -e "${YELLOW}   Isso inclui:${NC}"
echo -e "${YELLOW}   • Aplicação e todos os arquivos${NC}"
echo -e "${YELLOW}   • Configurações do Nginx${NC}"
echo -e "${YELLOW}   • Serviços do sistema${NC}"
echo -e "${YELLOW}   • Backups (opcional)${NC}\n"

read -p "Tem certeza que deseja continuar? (digite 'REMOVER' para confirmar): " confirm

if [ "$confirm" != "REMOVER" ]; then
    log "Operação cancelada pelo usuário."
    exit 0
fi

echo ""
read -p "Deseja também remover os backups? (s/N): " remove_backups

log "Iniciando desinstalação do Lex Flow..."

# Parar e desabilitar serviço
log "Parando e desabilitando serviço..."
if systemctl is-active --quiet lex-flow 2>/dev/null; then
    sudo systemctl stop lex-flow
fi

if systemctl is-enabled --quiet lex-flow 2>/dev/null; then
    sudo systemctl disable lex-flow
fi

# Remover arquivo de serviço systemd
log "Removendo serviço systemd..."
if [ -f /etc/systemd/system/lex-flow.service ]; then
    sudo rm /etc/systemd/system/lex-flow.service
    sudo systemctl daemon-reload
fi

# Remover configuração do Nginx
log "Removendo configuração do Nginx..."
if [ -f /etc/nginx/sites-available/lex-flow ]; then
    sudo rm /etc/nginx/sites-available/lex-flow
fi

if [ -L /etc/nginx/sites-enabled/lex-flow ]; then
    sudo rm /etc/nginx/sites-enabled/lex-flow
fi

# Restaurar site padrão do Nginx (opcional)
if [ -f /etc/nginx/sites-available/default ] && [ ! -L /etc/nginx/sites-enabled/default ]; then
    warn "Restaurando site padrão do Nginx..."
    sudo ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
fi

# Testar e reiniciar Nginx
if command -v nginx &> /dev/null; then
    if sudo nginx -t 2>/dev/null; then
        sudo systemctl restart nginx
        log "Nginx reiniciado com sucesso"
    else
        warn "Erro na configuração do Nginx. Pode ser necessário verificar manualmente."
    fi
fi

# Remover diretório da aplicação
log "Removendo diretório da aplicação..."
if [ -d /opt/lex-flow ]; then
    sudo rm -rf /opt/lex-flow
fi

# Remover backups (se solicitado)
if [[ "$remove_backups" =~ ^[Ss]$ ]]; then
    log "Removendo backups..."
    if [ -d /opt/lex-flow-backups ]; then
        sudo rm -rf /opt/lex-flow-backups
    fi
else
    if [ -d /opt/lex-flow-backups ]; then
        warn "Backups mantidos em: /opt/lex-flow-backups"
    fi
fi

# Remover cron job de backup
log "Removendo cron job de backup..."
crontab -l 2>/dev/null | grep -v "lex-flow" | crontab - 2>/dev/null || true

# Parar processos PM2 relacionados (se existirem)
if command -v pm2 &> /dev/null; then
    log "Verificando processos PM2..."
    pm2 delete lex-flow 2>/dev/null || true
    pm2 save 2>/dev/null || true
fi

# Limpar cache do npm/pnpm (opcional)
log "Limpando cache..."
if command -v pnpm &> /dev/null; then
    pnpm store prune 2>/dev/null || true
fi

if command -v npm &> /dev/null; then
    npm cache clean --force 2>/dev/null || true
fi

# Verificar se ainda existem processos relacionados
log "Verificando processos restantes..."
PROCESSES=$(ps aux | grep -i "lex-flow" | grep -v grep | wc -l)
if [ "$PROCESSES" -gt 0 ]; then
    warn "Ainda existem $PROCESSES processo(s) relacionado(s) ao Lex Flow em execução."
    echo "Execute 'ps aux | grep lex-flow' para verificar."
fi

# Verificar portas em uso
log "Verificando portas..."
if command -v netstat &> /dev/null; then
    PORTS=$(netstat -tlnp 2>/dev/null | grep -E ":3000|:80" | wc -l)
    if [ "$PORTS" -gt 0 ]; then
        warn "Algumas portas ainda podem estar em uso:"
        netstat -tlnp 2>/dev/null | grep -E ":3000|:80" || true
    fi
fi

# Remover logs específicos (opcional)
log "Limpando logs..."
sudo journalctl --vacuum-time=1d 2>/dev/null || true

# Informações sobre o que NÃO foi removido
echo -e "\n${YELLOW}📋 O que NÃO foi removido:${NC}"
echo -e "   • Node.js e pnpm (podem ser usados por outros projetos)"
echo -e "   • Nginx (pode estar sendo usado por outros sites)"
echo -e "   • PM2 (pode estar gerenciando outros processos)"
echo -e "   • Dependências do sistema (build-essential, curl, etc.)"

if [[ "$remove_backups" =~ ^[Nn]$ ]] || [ -z "$remove_backups" ]; then
    echo -e "   • Backups em /opt/lex-flow-backups"
fi

echo -e "\n${BLUE}💡 Para remover completamente as dependências (CUIDADO):${NC}"
echo -e "   ${YELLOW}sudo apt remove --purge nodejs npm nginx pm2${NC}"
echo -e "   ${YELLOW}sudo apt autoremove${NC}"
echo -e "   ${RED}⚠️  Isso pode afetar outros projetos!${NC}"

# Verificação final
log "Verificando remoção..."
REMAINING_FILES=0

if [ -d /opt/lex-flow ]; then
    warn "Diretório /opt/lex-flow ainda existe"
    REMAINING_FILES=$((REMAINING_FILES + 1))
fi

if [ -f /etc/systemd/system/lex-flow.service ]; then
    warn "Arquivo de serviço ainda existe"
    REMAINING_FILES=$((REMAINING_FILES + 1))
fi

if [ -f /etc/nginx/sites-available/lex-flow ]; then
    warn "Configuração do Nginx ainda existe"
    REMAINING_FILES=$((REMAINING_FILES + 1))
fi

# Resultado final
echo -e "\n${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
if [ "$REMAINING_FILES" -eq 0 ]; then
    echo -e "${GREEN}║                 DESINSTALAÇÃO CONCLUÍDA!                    ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"
    echo -e "${GREEN}✅ Lex Flow foi removido completamente do sistema.${NC}"
else
    echo -e "${YELLOW}║              DESINSTALAÇÃO PARCIALMENTE CONCLUÍDA           ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}\n"
    echo -e "${YELLOW}⚠️  Alguns arquivos podem não ter sido removidos. Verifique manualmente.${NC}"
fi

echo -e "\n${BLUE}📊 Resumo da Remoção:${NC}"
echo -e "   • Aplicação: ${GREEN}Removida${NC}"
echo -e "   • Serviço systemd: ${GREEN}Removido${NC}"
echo -e "   • Configuração Nginx: ${GREEN}Removida${NC}"
echo -e "   • Cron jobs: ${GREEN}Removidos${NC}"

if [[ "$remove_backups" =~ ^[Ss]$ ]]; then
    echo -e "   • Backups: ${GREEN}Removidos${NC}"
else
    echo -e "   • Backups: ${YELLOW}Mantidos${NC}"
fi

echo -e "\n${BLUE}Obrigado por usar o Lex Flow! 👋${NC}"

log "Desinstalação finalizada!"

