# src/utils/decorators.py

import jwt
from functools import wraps
from flask import request, jsonify, current_app
# Verifique se o caminho de importação do modelo User está correto
from src.models.user import User 

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            if auth_header.startswith('Bearer '):
                token = auth_header.split(" ")[1]

        if not token:
            return jsonify({'message': 'Token está faltando!'}), 401

        try:
            data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
            # Idealmente, você buscaria o usuário no banco para garantir que ele ainda existe
            # user = User.query.filter_by(id=data['user_id']).first()
            # if not user:
            #     return jsonify({'message': 'Usuário não encontrado!'}), 401
            current_user = {'id': data['user_id'], 'username': data['username']}
        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token expirou!'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Token é inválido!'}), 401

        return f(current_user, *args, **kwargs)

    return decorated