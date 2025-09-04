# src/routes/telos.py

from flask import Blueprint, jsonify, request
from src import db
from src.models.telos import TelosFramework, TelosReview
from src.utils.decorators import token_required 
import logging # Adicione o import de logging

telos_bp = Blueprint('telos', __name__)

# Configura um logger para este blueprint
logger = logging.getLogger(__name__)

# --- ROTAS DO TELOS FRAMEWORK (Para a página TelosFramework.jsx) ---

@telos_bp.route('/framework', methods=['GET'])
@token_required
def get_telos_framework(current_user):
    # CORREÇÃO: Adicionado bloco try...except para capturar erros
    try:
        framework = TelosFramework.query.filter_by(user_id=current_user['id']).first()
        if not framework:
            # É melhor retornar um objeto vazio ou null dentro da estrutura esperada
            return jsonify({'framework': None})
        return jsonify({'framework': framework.to_dict()})
    except Exception as e:
        logger.error(f"Erro ao buscar Telos Framework para o usuário {current_user['id']}: {e}")
        # Sempre retorne um JSON de erro com um status HTTP apropriado
        return jsonify({'error': 'Ocorreu um erro interno ao carregar o framework.'}), 500


@telos_bp.route('/framework', methods=['POST'])
@token_required
def save_telos_framework(current_user):
    # CORREÇÃO: Adicionado bloco try...except
    try:
        data = request.get_json()
        if not data or 'content' not in data:
            return jsonify({'error': 'Conteúdo ausente no corpo da requisição'}), 400
        content = data.get('content')

        framework = TelosFramework.query.filter_by(user_id=current_user['id']).first()
        if framework:
            framework.content = content
        else:
            framework = TelosFramework(user_id=current_user['id'], content=content)
            db.session.add(framework)
        
        db.session.commit()
        return jsonify({'message': 'Framework salvo com sucesso!', 'framework': framework.to_dict()})
    except Exception as e:
        db.session.rollback() # Desfaz a transação em caso de erro
        logger.error(f"Erro ao salvar Telos Framework para o usuário {current_user['id']}: {e}")
        return jsonify({'error': 'Ocorreu um erro interno ao salvar o framework.'}), 500


# --- ROTAS DO TELOS REVIEW (Para a página TelosReview.jsx) ---

@telos_bp.route('/reviews', methods=['GET'])
@token_required
def get_telos_reviews(current_user):
    # CORREÇÃO: Adicionado bloco try...except para capturar erros
    try:
        reviews = TelosReview.query.filter_by(user_id=current_user['id']).order_by(TelosReview.review_date.desc()).all()
        return jsonify({'reviews': [r.to_dict() for r in reviews]})
    except Exception as e:
        logger.error(f"Erro ao buscar Telos Reviews para o usuário {current_user['id']}: {e}")
        # Esta é a rota que provavelmente está causando o erro que você vê
        return jsonify({'error': 'Ocorreu um erro interno ao carregar as revisões.'}), 500


@telos_bp.route('/review', methods=['POST'])
@token_required
def save_telos_review(current_user):
    # CORREÇÃO: Adicionado bloco try...except
    try:
        data = request.get_json()
        review_date_str = data.get('review_date')
        content = data.get('content')
        
        if not review_date_str or content is None:
             return jsonify({'error': 'Dados da revisão ausentes (review_date, content)'}), 400

        review = TelosReview.query.filter_by(user_id=current_user['id'], review_date=review_date_str).first()
        if review:
            review.content = content
        else:
            review = TelosReview(user_id=current_user['id'], review_date=review_date_str, content=content)
            db.session.add(review)
            
        db.session.commit()
        return jsonify({'review': review.to_dict()})
    except Exception as e:
        db.session.rollback()
        logger.error(f"Erro ao salvar Telos Review para o usuário {current_user['id']}: {e}")
        return jsonify({'error': 'Ocorreu um erro interno ao salvar a revisão.'}), 500

# ...