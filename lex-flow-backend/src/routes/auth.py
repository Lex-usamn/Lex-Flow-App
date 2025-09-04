# lex-flow-backend/src/routes/auth.py

from flask import Blueprint, request, jsonify, make_response
from src.models.user import User
from src.models.tenant import Tenant, Plan, Subscription # Modelos de SaaS
from src import db # Importa a instância 'db' do pacote src
from datetime import datetime
from functools import wraps

auth_bp = Blueprint('auth', __name__)

def token_required(f):
    """
    Decorator para rotas que requerem autenticação.
    Mantido como no seu original, já funciona bem.
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        if request.method == 'OPTIONS':
            response = make_response()
            response.status_code = 204
            return response

        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'success': False, 'error': 'Token de acesso requerido'}), 401
        
        try:
            if token.startswith('Bearer '):
                token = token[7:]
            
            current_user = User.verify_token(token)
            if not current_user:
                return jsonify({'success': False, 'error': 'Token inválido ou expirado'}), 401
                
        except Exception as e:
            return jsonify({'success': False, 'error': 'Token inválido', 'details': str(e)}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

@auth_bp.route('/register', methods=['POST'])
def register():
    """Registrar novo usuário e criar sua organização (Tenant)."""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('email') or not data.get('password'):
            return jsonify({'error': 'Username, email e password são obrigatórios'}), 400
        
        username = data['username'].strip()
        email = data['email'].strip().lower()
        password = data['password']
        
        if User.query.filter((User.username == username) | (User.email == email)).first():
            return jsonify({'error': 'Username ou email já está em uso'}), 409
        
        # --- LÓGICA DE CRIAÇÃO PARA O SAAS ---
        # 1. Criar um novo Tenant para o usuário
        new_tenant = Tenant(name=f"Organização de {username}")
        db.session.add(new_tenant)
        db.session.flush() # Força o INSERT para que o new_tenant.id seja gerado e possa ser usado

        # 2. Criar o novo usuário e associá-lo ao Tenant
        user = User(
            username=username, 
            email=email,
            tenant_id=new_tenant.id # Link para o Tenant
        )
        user.set_password(password)
        db.session.add(user)

        # 3. Assinar o novo Tenant ao plano gratuito (padrão)
        free_plan = Plan.query.filter_by(name='Free').first()
        if not free_plan:
            # Em um ambiente real, você deve popular a tabela de planos antecipadamente.
            free_plan = Plan(name='Free', price=0, project_limit=3, user_limit=1)
            db.session.add(free_plan)
            db.session.flush() # Gera o ID do plano

        new_subscription = Subscription(
            tenant_id=new_tenant.id,
            plan_id=free_plan.id,
            status='active'
        )
        db.session.add(new_subscription)
        
        db.session.commit()
        # --- FIM DA LÓGICA SAAS ---
        
        # Gerar token (agora com tenant_id incluído, graças à alteração no modelo User)
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
    """Fazer login do usuário (sem grandes alterações necessárias aqui)."""
    try:
        data = request.get_json()
        
        if not data or not data.get('username') or not data.get('password'):
            return jsonify({'error': 'Username e password são obrigatórios'}), 400
        
        username = data['username'].strip()
        password = data['password']
        
        user = User.query.filter(
            (User.username == username) | (User.email == username)
        ).first()
        
        if not user or not user.check_password(password):
            return jsonify({'error': 'Credenciais inválidas'}), 401
        
        if not user.is_active:
            return jsonify({'error': 'Conta desativada'}), 401
        
        user.last_login = datetime.utcnow()
        db.session.commit()
        
        # O token gerado aqui agora naturalmente incluirá o tenant_id
        token = user.generate_token()
        
        return jsonify({
            'message': 'Login realizado com sucesso',
            'user': user.to_dict(),
            'token': token
        }), 200
        
    except Exception as e:
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

# As rotas abaixo não precisam de alteração, pois elas operam
# no objeto 'current_user', que já é o usuário correto.
# A lógica de isolamento de dados será aplicada nas rotas que
# lidam com recursos compartilhados (ex: projetos, tarefas).

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
        
        # A lógica de atualização permanece a mesma
        if 'email' in data:
            email = data['email'].strip().lower()
            if User.query.filter(User.email == email, User.id != current_user.id).first():
                return jsonify({'error': 'Email já está em uso'}), 409
            current_user.email = email
        
        if 'username' in data:
            username = data['username'].strip()
            if User.query.filter(User.username == username, User.id != current_user.id).first():
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
        
        if not current_user.check_password(data['current_password']):
            return jsonify({'error': 'Senha atual incorreta'}), 401
        
        current_user.set_password(data['new_password'])
        db.session.commit()
        
        return jsonify({'message': 'Senha alterada com sucesso'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': f'Erro interno do servidor: {str(e)}'}), 500

@auth_bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    """Logout do usuário"""
    return jsonify({'message': 'Logout realizado com sucesso'}), 200