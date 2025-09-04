# src/main.py (VERSÃO FINAL, REVISADA E COMENTADA)

import os
import sys

# DON'T CHANGE THIS !!!
# Garante que os módulos dentro de 'src' possam ser encontrados.
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_socketio import SocketIO
from flask_migrate import Migrate
from src import db

# Importação dos componentes da aplicação
from src.models.user import db
from src.routes.user import user_bp
from src.routes.auth import auth_bp
from src.routes.cloud import cloud_bp
from src.routes.collaboration import collaboration_bp
from src.routes.ai import ai_bp
from src.routes.telos import telos_bp
from src.routes.quick_notes import quick_notes_bp
from src.routes.pomodoro import pomodoro_bp
from src.routes.gamification import gamification_bp
from src.routes.integrations import integrations_bp
from src.routes.study_videos import study_videos_bp
from src.routes.analytics import analytics_bp
from src.services.collaboration import CollaborationService

# --- CRIAÇÃO DAS INSTÂNCIAS GLOBAIS DAS EXTENSÕES ---
# Inicializar as extensões fora da fábrica permite que sejam importadas em outros módulos (como blueprints) sem causar importações circulares.
socketio = SocketIO(cors_allowed_origins="*")
migrate = Migrate()

def create_app():
    """
    Fábrica de Aplicação (Application Factory Pattern).
    Este padrão organiza a criação da aplicação, permitindo múltiplas configurações
    (ex: desenvolvimento, teste, produção) e evitando problemas de importação circular.
    """
    
    # --- 1. CRIAÇÃO DA INSTÂNCIA DO APP ---
    # O caminho para 'static_folder' é ajustado para apontar para o diretório 'dist' do build do frontend.
    app = Flask(
        __name__, 
        static_folder=os.path.join(os.path.dirname(__file__), '..', '..', 'lex-flow', 'dist')
    )

    # --- 2. SEÇÃO DE CONFIGURAÇÃO DO APP ---
    # Centraliza todas as configurações, priorizando variáveis de ambiente para segurança e flexibilidade.
    # Chave secreta usada para assinar sessões, tokens JWT e outras necessidades de segurança.
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'uma-chave-secreta-padrao-muito-forte-e-dificil-de-adivinhar-em-desenvolvimento')
    
    # URL de conexão com o banco de dados. Usa DATABASE_URL do ambiente ou um fallback para um banco SQLite local.
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL') or \
                                            f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
    
    # Desativa um recurso do Flask-SQLAlchemy que não é necessário e consome recursos.
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # --- 3. SEÇÃO DE INICIALIZAÇÃO DAS EXTENSÕES ---
    # Associa as instâncias das extensões com a aplicação Flask.
    db.init_app(app)
    migrate.init_app(app, db)
    socketio.init_app(app)
    
    # Habilita o Cross-Origin Resource Sharing (CORS) para permitir requisições de diferentes origens (ex: frontend em localhost:3000).
    CORS(
    app,
    resources={r"/api/*": {"origins": "*"}},  # Aplica CORS apenas para rotas que começam com /api/
    allow_headers=["Authorization", "Content-Type"],  # Permite explicitamente os cabeçalhos de Autorização e Conteúdo
    supports_credentials=True
)

    # --- 4. SEÇÃO DE REGISTRO DE BLUEPRINTS ---
    # Organiza a aplicação em componentes modulares (blueprints), cada um com um prefixo de URL.
    
    # SUGESTÃO APLICADA: Usar '/api/users' para rotas de perfil de usuário. É mais específico.
    app.register_blueprint(user_bp, url_prefix='/api/users')
    
    # Blueprint para autenticação (login, registro, etc.).
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    
    # Blueprint para sincronização com a nuvem (Google Drive, Dropbox, etc.).
    app.register_blueprint(cloud_bp, url_prefix='/api/cloud-sync')
    
    # Blueprint para funcionalidades de colaboração em tempo real.
    app.register_blueprint(collaboration_bp, url_prefix='/api/collaboration')
    
    # Blueprint para integrações com serviços de terceiros.
    app.register_blueprint(integrations_bp, url_prefix='/api/integrations')
    
    # Blueprint para funcionalidades de Inteligência Artificial.
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(telos_bp, url_prefix='/api/telos')
    app.register_blueprint(quick_notes_bp, url_prefix='/api/quicknotes')
    app.register_blueprint(pomodoro_bp, url_prefix='/api/pomodoro')
    app.register_blueprint(gamification_bp, url_prefix='/api/gamification')
    app.register_blueprint(study_videos_bp, url_prefix='/api/videostudy/videos')
    
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')

    # --- 5. INICIALIZAÇÃO DE SERVIÇOS E ROTAS GLOBAIS ---
    
    # Inicializa o serviço de colaboração, passando a instância do SocketIO.
    collaboration_service = CollaborationService(socketio)
    # Anexa o serviço ao objeto 'app' para que possa ser acessado em outras partes da aplicação, se necessário.
    app.collaboration_service = collaboration_service

    # Rota "catch-all" para servir a aplicação de página única (SPA) do frontend.
    # Qualquer rota não reconhecida pela API do Flask será direcionada para o 'index.html' do frontend,
    # permitindo que o roteador do React (React Router) assuma o controle.
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        static_folder_path = app.static_folder
        
        # Se o caminho solicitado for um arquivo existente na pasta estática (ex: CSS, JS, imagem), sirva-o diretamente.
        if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
            return send_from_directory(static_folder_path, path)
        else:
            # Caso contrário, sirva o 'index.html', que é o ponto de entrada da SPA.
            index_path = os.path.join(static_folder_path, 'index.html')
            if os.path.exists(index_path):
                return send_from_directory(static_folder_path, 'index.html')
            else:
                # Fallback caso o 'index.html' não seja encontrado.
                return jsonify({"error": "Frontend entry point (index.html) not found in static folder."}), 404
    
    # Retorna a instância do aplicativo configurada.
    return app

# --- PONTO DE ENTRADA DA APLICAÇÃO ---

# Cria a instância do app usando a fábrica.
# Esta instância 'app' será usada por servidores WSGI como Gunicorn ou uWSGI em produção.
app = create_app()

# Este bloco só é executado quando o script é chamado diretamente (ex: 'python src/main.py').
# É usado para iniciar o servidor de desenvolvimento do Flask/SocketIO.
if __name__ == '__main__':
    # 'host="0.0.0.0"' torna o servidor acessível na rede local.
    # 'debug=True' ativa o recarregamento automático e o debugger. Não use em produção!
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)