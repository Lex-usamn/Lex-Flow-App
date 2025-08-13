# Lex Flow 2.0 - Guia de Instalação no Ubuntu 22.04 LTS

Este guia detalha o processo de instalação do Lex Flow 2.0, um aplicativo de produtividade pessoal completo, em uma máquina virtual (VM) ou servidor rodando Ubuntu 22.04 LTS.

## 🚀 Funcionalidades Incluídas

Esta versão do Lex Flow inclui todas as melhorias implementadas até agora:

-   **Interface Refinada (UI/UX)**: Design moderno, limpo e responsivo.
-   **Sincronização em Nuvem**: Integração com Google Drive, Dropbox, OneDrive (backend pronto).
-   **Colaboração**: Compartilhamento de tarefas e projetos em tempo real (backend pronto).
-   **IA Integrada**: Sugestões inteligentes e insights de produtividade (Gemini, ChatGPT).
-   **Integrações Externas**: Obsidian, Trello, Notion, GitHub, Capacities (backend pronto).
-   **PWA (Progressive Web App)**: Instalação como aplicativo nativo no desktop/mobile.
-   **Gamificação**: Sistema de níveis, XP e conquistas.
-   **Notificações Personalizadas**: Lembretes para Pomodoro, tarefas, etc.
-   **Relatórios e Estatísticas Avançadas**: Dashboard analítico com gráficos.
-   **Integração com Calendário**: Exportação ICS e sincronização.
-   **Modo Foco Aprimorado**: Ferramentas para manter a concentração.
-   **Exportação Completa de Dados**: Markdown, PDF, JSON, CSV.

## 📋 Pré-requisitos

-   Uma VM ou servidor com **Ubuntu 22.04 LTS** (mínimo 2GB RAM, 20GB de disco).
-   Acesso `sudo` (usuário com permissões administrativas).
-   Conexão com a internet.

## 📦 Conteúdo do Pacote de Instalação

O pacote `lex-flow-ubuntu-install.tar.gz` contém:

-   `lex-flow/`: Diretório do frontend (aplicativo web React).
-   `lex-flow-backend/`: Diretório do backend (API Flask).
-   `install-ubuntu.sh`: Script de instalação automatizado.
-   `uninstall-ubuntu.sh`: Script de desinstalação.
-   `README.md`: Este arquivo.

## ⚙️ Passos para Instalação

Siga os passos abaixo para instalar o Lex Flow em seu sistema Ubuntu:

### 1. Transferir e Extrair o Pacote

Transfira o arquivo `lex-flow-ubuntu-install.tar.gz` para sua VM Ubuntu (ex: usando `scp`, `sftp` ou compartilhamento de pasta).

Abra o terminal na sua VM e execute:

```bash
# Navegue até o diretório onde você transferiu o arquivo
cd /caminho/para/onde/voce/salvou

# Extraia o conteúdo do pacote
tar -xzf lex-flow-ubuntu-install.tar.gz

# Navegue para o diretório extraído
cd lex-flow
```

### 2. Executar o Script de Instalação

O script `install-ubuntu.sh` automatiza todo o processo de instalação de dependências, Node.js, pnpm, Python, ambiente virtual, Nginx, Supervisor e configuração de firewall.

```bash
# Torne o script executável
chmod +x install-ubuntu.sh

# Execute o script de instalação com sudo
sudo ./install-ubuntu.sh
```

O script fará o seguinte:

-   Atualizará os pacotes do sistema.
-   Instalará dependências essenciais (curl, wget, git, build-essential, python3, pip, venv, nginx, supervisor, ufw, rsync, unzip).
-   Instalará Node.js 20 e pnpm.
-   Criará um usuário de sistema `lexflow` para rodar os serviços.
-   Copiará os arquivos do frontend e backend para `/opt/lex-flow` e `/opt/lex-flow-backend` respectivamente.
-   Instalará as dependências do frontend (pnpm) e fará o build de produção.
-   Criará um ambiente virtual Python para o backend e instalará suas dependências.
-   Configurará o Nginx como proxy reverso para servir o frontend e o backend.
-   Configurará o Supervisor para gerenciar o processo do backend.
-   Configurará o firewall (UFW) para permitir acesso SSH, HTTP e HTTPS.
-   Criará scripts de atalho `lex-flow-update` e `lex-flow-uninstall` em `/usr/local/bin`.

### 3. Configurar Chaves de API (Opcional, para IA)

Para utilizar as funcionalidades de IA (Gemini, ChatGPT), você precisará configurar suas chaves de API. Crie um arquivo `.env` no diretório do backend:

```bash
sudo nano /opt/lex-flow-backend/.env
```

Adicione suas chaves de API (substitua `SUA_CHAVE_OPENAI` e `SUA_CHAVE_GEMINI` pelas suas chaves reais):

```
OPENAI_API_KEY=SUA_CHAVE_OPENAI
GEMINI_API_KEY=SUA_CHAVE_GEMINI
```

Salve e feche o arquivo (`Ctrl+X`, `Y`, `Enter`).

Após configurar as chaves, reinicie o serviço do backend para que as alterações entrem em vigor:

```bash
sudo supervisorctl restart lex-flow-backend
```

## 🌐 Acessando o Lex Flow

Após a instalação bem-sucedida, você poderá acessar o Lex Flow pelo seu navegador:

-   **Frontend (Aplicativo Web)**: `http://localhost` (se estiver acessando da própria VM) ou `http://<IP_DA_SUA_VM>` (se estiver acessando de outra máquina na rede).
-   **Backend API**: `http://localhost/api`

## 🔧 Comandos Úteis

-   **Atualizar o Lex Flow**: `sudo lex-flow-update`
-   **Desinstalar o Lex Flow**: `sudo lex-flow-uninstall`
-   **Verificar status do Nginx**: `sudo systemctl status nginx`
-   **Verificar status do Backend**: `sudo supervisorctl status lex-flow-backend`
-   **Ver logs do Backend**: `sudo tail -f /var/log/lex-flow-backend.log`

## ⚠️ Solução de Problemas

-   **`ERR_PNPM_NO_PKG_MANIFEST`**: Certifique-se de que você extraiu o `tar.gz` e está executando o `install-ubuntu.sh` a partir do diretório `lex-flow` que foi extraído.
-   **Problemas de Permissão**: Verifique se você está executando o script de instalação com `sudo`.
-   **Nginx não inicia**: Verifique a configuração do Nginx com `sudo nginx -t` para identificar erros de sintaxe.
-   **Backend não inicia**: Verifique os logs do backend em `/var/log/lex-flow-backend.log` para mensagens de erro.
-   **Firewall**: Se você tiver problemas de acesso, verifique o status do UFW com `sudo ufw status`.

Se você encontrar qualquer problema que não consiga resolver, por favor, forneça os logs de erro detalhados para assistência.

