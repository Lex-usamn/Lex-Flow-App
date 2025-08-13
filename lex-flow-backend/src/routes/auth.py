from flask import Blueprint, request, jsonify, make_response 
from src.models.user import User, db
from datetime import datetime
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    """
    Decorator para rotas que requerem autenticação.
    VERSÃO FINAL CORRIGIDA PARA LIDAR COM PREFLIGHT (OPTIONS).
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        # --- A CORREÇÃO DEFINITIVA ---
        # Requisições de preflight do CORS usam o método OPTIONS. O navegador envia
        # isso para verificar se a requisição POST com o cabeçalho 'Authorization' é permitida.
        # Precisamos interceptar isso e retornar uma resposta vazia e bem-sucedida IMEDIATAMENTE.
        if request.method == 'OPTIONS':
            # Cria uma resposta vazia.
            response = make_response()
            # O Flask-CORS (configurado no main.py) adicionará os cabeçalhos
            # 'Access-Control-Allow-Origin', 'Access-Control-Allow-Headers', etc.
            # a esta resposta antes de enviá-la.
            # O status 204 "No Content" é o mais apropriado para uma preflight bem-sucedida.
            response.status_code = 204
            return response
        # --- FIM DA CORREÇÃO ---

        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'error': 'Token de acesso requerido'}), 401
        
        try:
            # Remove 'Bearer ' do token se presente
            if token.startswith('Bearer '):
                token = token[7:]
            
            current_user = User.verify_token(token)
            if not current_user:
                return jsonify({'success': False, 'error': 'Token inválido ou expirado'}), 401
                
        except Exception as e:
            return jsonify({'success': False, 'error': 'Token inválido', 'details': str(e)}), 401
        
        # Passa o usuário decodificado como primeiro argumento para a função da rota
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar novo usuário"""
    try:
        data = request.get_json()
        
        # Validar dados obrigatórios
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email e password são obrigatórios'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        # Validações básicas
        if len(username) < 3:
            return jsonify({'error': 'Username deve ter pelo menos 3 caracteres'}), 400
        
        if len(password) < 6:
            return jsonify({'error': 'Password deve ter pelo menos 6 caracteres'}), 400
        
        if '@' not in email:
            return jsonify({'error': 'Email inválido'}), 400
        
        # Verificar se usuário já existe
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Username já existe'}), 409
        
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'Email já está em uso'}), 409
        
        # Criar novo usuário
        user = User(username=username, email=email)
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Gerar token
        token = user.generate_token()
        
        return jsonify({
            'message': 'Usuário criado com sucesso',
            'user': user.to_dict(),
            'token': token
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """Fazer login do usuário"""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        # Buscar usuário (pode ser username ou email)
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Conta desativada'}), 401
        
        # Atualizar último login
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # Gerar token
        token = user.generate_token()
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@auth_bp.route('/verify', methods=['GET'])
@token_required
def verify_token(current_user):
    """Verificar se o token é válido"""
    return jsonify({
        'valid': True,
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    """Obter perfil do usuário atual"""
    return jsonify({
        'user': current_user.to_dict()
    }), 200

@auth_bp.route('/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    """Atualizar perfil do usuário"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'Dados não fornecidos'}), 400
        
        # Atualizar campos permitidos
        if 'email' in data:
            email = data['email'].strip().lower()
            if '@' not in email:
                return jsonify({'error': 'Email inválido'}), 400
            
            # Verificar se email já está em uso por outro usuário
            existing_user = User.query.filter(
                User.email == email,
                User.id != current_user.id
            ).first()
            
            if existing_user:
                return jsonify({'error': 'Email já está em uso'}), 409
            
            current_user.email = email
        
        if 'username' in data:
            username = data['username'].strip()
            if len(username) < 3:
                return jsonify({'error': 'Username deve ter pelo menos 3 caracteres'}), 400
            
            # Verificar se username já está em uso por outro usuário
            existing_user = User.query.filter(
                User.username == username,
                User.id != current_user.id
            ).first()
            
            if existing_user:
                return jsonify({'error': 'Username já existe'}), 409
            
            current_user.username = username
        
        db.session.commit()
        
        return jsonify({
            'message': 'Perfil atualizado com sucesso',
            'user': current_user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@auth_bp.route('/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    """Alterar senha do usuário"""
    try:
        data = request.get_json()
        
        if not data or not data.get('current_password') or not data.get('new_password'):
            return jsonify({'error': 'Senha atual e nova senha são obrigatórias'}), 400
        
        current_password = data['current_password']
        new_password = data['new_password']
        
        # Verificar senha atual
        if not current_user.check_password(current_password):
            return jsonify({'error': 'Senha atual incorreta'}), 401
        
        # Validar nova senha
        if len(new_password) < 6:
            return jsonify({'error': 'Nova senha deve ter pelo menos 6 caracteres'}), 400
        
        # Atualizar senha
        current_user.set_password(new_password)
        db.session.commit()
        
        return jsonify({
            'message': 'Senha alterada com sucesso'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout do usuário (apenas confirma que o token é válido)"""
    return jsonify({
        'message': 'Logout realizado com sucesso'
    }), 200

