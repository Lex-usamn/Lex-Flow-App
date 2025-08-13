# Lex Flow - Instalação em VM Ubuntu 22.04

## 🚀 Guia Completo de Instalação

Este guia fornece instruções detalhadas para instalar o **Lex Flow** em uma máquina virtual Ubuntu 22.04.

### 📋 Pré-requisitos

- **Sistema Operacional**: Ubuntu 22.04 LTS (recomendado)
- **RAM**: Mínimo 2GB, recomendado 4GB
- **Armazenamento**: Mínimo 10GB de espaço livre
- **Usuário**: Conta de usuário com privilégios sudo (não root)
- **Conexão**: Acesso à internet para download de dependências

### 🔧 Instalação Automática (Recomendada)

#### 1. Download dos Arquivos

```bash
# Opção 1: Se você já tem os arquivos
cd /caminho/para/lex-flow

# Opção 2: Clone do repositório (se disponível)
git clone <url-do-repositorio> lex-flow
cd lex-flow
```

#### 2. Executar Script de Instalação

```bash
# Dar permissão de execução
chmod +x install.sh

# Executar instalação
./install.sh
```

O script irá:
- ✅ Atualizar o sistema
- ✅ Instalar Node.js 20.x
- ✅ Instalar pnpm
- ✅ Instalar e configurar Nginx
- ✅ Instalar PM2 para gerenciamento de processos
- ✅ Configurar o aplicativo como serviço systemd
- ✅ Configurar backup automático
- ✅ Configurar firewall básico

#### 3. Verificar Instalação

Após a instalação, acesse:
- **URL Principal**: http://localhost
- **URL Alternativa**: http://localhost:3000
- **IP da VM**: http://[IP-DA-VM]

### 🛠️ Instalação Manual

Se preferir instalar manualmente ou o script automático falhar:

#### 1. Atualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

#### 2. Instalar Dependências

```bash
# Dependências básicas
sudo apt install -y curl wget git build-essential software-properties-common

# Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# pnpm
npm install -g pnpm

# Nginx
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx

# PM2
npm install -g pm2
```

#### 3. Configurar Aplicação

```bash
# Criar diretório
sudo mkdir -p /opt/lex-flow
sudo chown $USER:$USER /opt/lex-flow

# Copiar arquivos
cp -r . /opt/lex-flow/
cd /opt/lex-flow

# Instalar dependências
pnpm install

# Build da aplicação
pnpm run build
```

#### 4. Configurar Nginx

```bash
# Criar configuração
sudo nano /etc/nginx/sites-available/lex-flow
```

Cole o conteúdo:

```nginx
server {
    listen 80;
    server_name localhost;
    root /opt/lex-flow/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=31536000" always;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location /sw.js {
        add_header Cache-Control "no-cache";
        expires 0;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/lex-flow /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. Configurar Serviço Systemd

```bash
# Criar arquivo de serviço
sudo nano /etc/systemd/system/lex-flow.service
```

Cole o conteúdo:

```ini
[Unit]
Description=Lex Flow - Aplicativo de Produtividade Pessoal
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/lex-flow
ExecStart=/usr/bin/pnpm run preview --host 0.0.0.0 --port 3000
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=3000

[Install]
WantedBy=multi-user.target
```

```bash
# Habilitar e iniciar serviço
sudo systemctl daemon-reload
sudo systemctl enable lex-flow
sudo systemctl start lex-flow
```

### 🔍 Verificação e Troubleshooting

#### Verificar Status dos Serviços

```bash
# Status da aplicação
sudo systemctl status lex-flow

# Status do Nginx
sudo systemctl status nginx

# Logs da aplicação
journalctl -u lex-flow -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

#### Comandos Úteis

```bash
# Reiniciar aplicação
sudo systemctl restart lex-flow

# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar portas em uso
sudo netstat -tlnp | grep -E ":80|:3000"

# Verificar processos
ps aux | grep -E "node|nginx"
```

#### Problemas Comuns

**1. Aplicação não inicia**
```bash
# Verificar logs
journalctl -u lex-flow -n 50

# Verificar se a porta está livre
sudo lsof -i :3000

# Testar manualmente
cd /opt/lex-flow
pnpm run preview --host 0.0.0.0 --port 3000
```

**2. Nginx não serve a aplicação**
```bash
# Testar configuração
sudo nginx -t

# Verificar permissões
ls -la /opt/lex-flow/dist/

# Verificar se o build existe
ls -la /opt/lex-flow/dist/index.html
```

**3. Não consegue acessar externamente**
```bash
# Verificar firewall
sudo ufw status

# Permitir porta 80
sudo ufw allow 80/tcp

# Verificar IP da VM
ip addr show
```

### 🔒 Configurações de Segurança

#### Firewall Básico

```bash
# Configurar UFW
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

#### SSL/HTTPS (Opcional)

Para produção, configure SSL:

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado (substitua seu-dominio.com)
sudo certbot --nginx -d seu-dominio.com
```

### 📦 Backup e Manutenção

#### Backup Manual

```bash
# Executar backup
/opt/lex-flow/backup.sh

# Verificar backups
ls -la /opt/lex-flow-backups/
```

#### Backup Automático

O backup automático está configurado para rodar diariamente às 2h da manhã via cron.

```bash
# Verificar cron jobs
crontab -l

# Editar cron jobs
crontab -e
```

#### Atualização da Aplicação

```bash
cd /opt/lex-flow

# Fazer backup antes
./backup.sh

# Parar aplicação
sudo systemctl stop lex-flow

# Atualizar código (se necessário)
git pull  # ou copiar novos arquivos

# Reinstalar dependências
pnpm install

# Rebuild
pnpm run build

# Reiniciar aplicação
sudo systemctl start lex-flow
```

### 🗑️ Desinstalação

Para remover completamente o Lex Flow:

```bash
# Executar script de desinstalação
chmod +x uninstall.sh
./uninstall.sh
```

### 📊 Monitoramento

#### Logs em Tempo Real

```bash
# Logs da aplicação
journalctl -u lex-flow -f

# Logs do Nginx
sudo tail -f /var/log/nginx/access.log

# Logs do sistema
sudo tail -f /var/log/syslog
```

#### Métricas de Performance

```bash
# Uso de CPU e memória
htop

# Uso de disco
df -h

# Processos da aplicação
ps aux | grep lex-flow
```

### 🌐 Acesso Externo

Para acessar a aplicação de outras máquinas na rede:

1. **Descobrir IP da VM**:
   ```bash
   ip addr show
   ```

2. **Configurar port forwarding** (se usando VirtualBox/VMware):
   - VirtualBox: Configurações → Rede → Port Forwarding
   - Mapear porta 80 da VM para porta 8080 do host

3. **Acessar via navegador**:
   - `http://IP-DA-VM`
   - `http://localhost:8080` (se usando port forwarding)

### 📱 PWA (Progressive Web App)

O Lex Flow é um PWA completo:

- ✅ **Instalável**: Pode ser instalado como app nativo
- ✅ **Offline**: Funciona sem conexão com internet
- ✅ **Notificações**: Suporte a notificações push
- ✅ **Responsivo**: Funciona em desktop e mobile

Para instalar como PWA:
1. Acesse a aplicação no navegador
2. Procure pelo ícone "Instalar" na barra de endereços
3. Clique em "Instalar" e siga as instruções

### 🆘 Suporte

Se encontrar problemas:

1. **Verifique os logs**: `journalctl -u lex-flow -f`
2. **Consulte este README**: Seção de troubleshooting
3. **Verifique as configurações**: Arquivos em `/opt/lex-flow/`
4. **Teste manualmente**: Execute `pnpm run preview` no diretório da aplicação

### 📄 Arquivos Importantes

- **Aplicação**: `/opt/lex-flow/`
- **Configuração Nginx**: `/etc/nginx/sites-available/lex-flow`
- **Serviço Systemd**: `/etc/systemd/system/lex-flow.service`
- **Backups**: `/opt/lex-flow-backups/`
- **Logs**: `/var/log/nginx/` e `journalctl -u lex-flow`

---

## 🎉 Pronto!

Sua instalação do Lex Flow está completa! Acesse http://localhost e comece a usar seu aplicativo de produtividade pessoal.

**Recursos Principais**:
- 📋 Gerenciamento de tarefas com Top 3 prioridades
- 🍅 Timer Pomodoro integrado
- 📚 Gestão de estudos com vídeos do YouTube
- 📝 Sistema de anotações rápidas
- 🎯 Revisão TELOS para reflexão diária
- 📊 Análises e relatórios de produtividade
- 🏆 Sistema de gamificação com conquistas
- 🔄 Sincronização e backup automático
- 📱 PWA com funcionamento offline

Aproveite sua jornada de produtividade com o Lex Flow! 🚀

