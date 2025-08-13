from flask import Blueprint, request, jsonify
from src.services.ai_service import AIService
import asyncio
from functools import wraps
from datetime import datetime
from src.routes.auth import token_required 

ai_bp = Blueprint('ai', __name__)
ai_service = AIService()

def async_route(f):
    """Decorator para rotas assíncronas"""
    @wraps(f)
    def wrapper(*args, **kwargs):
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(f(*args, **kwargs))
        finally:
            loop.close()
    return wrapper

@ai_bp.route('/providers', methods=['GET', 'OPTIONS'])
@token_required
def get_ai_providers(current_user):
    """Retorna provedores de IA disponíveis"""
    try:
        providers = ai_service.get_available_providers()
        return jsonify({
            'success': True,
            'providers': providers,
            'message': f'{len(providers)} provedores disponíveis'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_bp.route('/task-suggestions', methods=['POST', 'OPTIONS'])
@token_required
@async_route
async def get_task_suggestions(current_user):
    """Gera sugestões inteligentes de tarefas"""
    try:
        data = request.get_json()
        
        # Validar dados de entrada
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Preparar contexto do usuário
        user_context = {
            'current_tasks': data.get('current_tasks', []),
            'completed_tasks': data.get('completed_tasks', []),
            'goals': data.get('goals', []),
            'preferences': data.get('preferences', {}),
            'additional_context': data.get('context', '')
        }
        
        # Gerar sugestões
        suggestions = await ai_service.get_task_suggestions(user_context)
        
        return jsonify({
            'success': True,
            'suggestions': suggestions,
            'count': len(suggestions),
            # LINHA CORRIGIDA ABAIXO
            'generated_at': datetime.now().isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'suggestions': ai_service._get_fallback_task_suggestions()
        }), 500

@ai_bp.route('/productivity-insights', methods=['POST', 'OPTIONS'])
@token_required
@async_route
async def get_productivity_insights(current_user):
    """Analisa dados e fornece insights de produtividade"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Preparar dados do usuário
        user_data = {
            'tasks_completed': data.get('tasks_completed', []),
            'pomodoro_sessions': data.get('pomodoro_sessions', []),
            'study_sessions': data.get('study_sessions', []),
            'daily_stats': data.get('daily_stats', {}),
            'weekly_stats': data.get('weekly_stats', {}),
            'goals_progress': data.get('goals_progress', {}),
            'time_tracking': data.get('time_tracking', [])
        }
        
        # Gerar insights
        insights = await ai_service.get_productivity_insights(user_data)
        
        return jsonify({
            'success': True,
            'insights': insights,
            'analysis_date': data.get('analysis_date', 'today')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'insights': ai_service._get_fallback_productivity_insights()
        }), 500

@ai_bp.route('/study-recommendations', methods=['POST', 'OPTIONS'])
@token_required
@async_route
async def get_study_recommendations(current_user):
    """Recomenda conteúdos de estudo baseados no histórico"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Preparar contexto de estudo
        study_context = {
            'completed_videos': data.get('completed_videos', []),
            'study_topics': data.get('study_topics', []),
            'learning_goals': data.get('learning_goals', []),
            'difficulty_preference': data.get('difficulty_preference', 'intermediário'),
            'time_available': data.get('time_available', '30 minutos'),
            'interests': data.get('interests', []),
            'current_projects': data.get('current_projects', [])
        }
        
        # Gerar recomendações
        recommendations = await ai_service.get_study_recommendations(study_context)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'count': len(recommendations),
            'based_on': list(study_context.keys())
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'recommendations': ai_service._get_fallback_study_recommendations()
        }), 500

@ai_bp.route('/schedule-optimization', methods=['POST', 'OPTIONS'])
@token_required
@async_route
async def optimize_schedule(current_user):
    """Otimiza cronograma baseado em padrões de produtividade"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'Dados não fornecidos'
            }), 400
        
        # Preparar dados do cronograma
        schedule_data = {
            'current_schedule': data.get('current_schedule', []),
            'productivity_patterns': data.get('productivity_patterns', {}),
            'energy_levels': data.get('energy_levels', {}),
            'task_priorities': data.get('task_priorities', []),
            'constraints': data.get('constraints', {}),
            'preferences': data.get('preferences', {}),
            'historical_performance': data.get('historical_performance', [])
        }
        
        # Otimizar cronograma
        optimization = await ai_service.optimize_schedule(schedule_data)
        
        return jsonify({
            'success': True,
            'optimization': optimization,
            'optimized_for': data.get('optimization_goal', 'produtividade geral')
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'optimization': ai_service._get_fallback_schedule_optimization()
        }), 500

@ai_bp.route('/smart-categorization', methods=['POST', 'OPTIONS'])
@token_required
@async_route
async def smart_categorization(current_user):
    """Categoriza automaticamente tarefas e anotações"""
    try:
        data = request.get_json()
        
        if not data or 'items' not in data:
            return jsonify({
                'success': False,
                'error': 'Items não fornecidos'
            }), 400
        
        items = data['items']
        categorized_items = []
        
        # Simular categorização inteligente
        # Em uma implementação real, usaria IA para categorizar
        for item in items:
            category = 'geral'
            confidence = 0.5
            
            text = item.get('text', '').lower()
            title = item.get('title', '').lower()
            
            # Regras simples de categorização
            if any(word in text + title for word in ['código', 'programar', 'bug', 'api', 'desenvolvimento']):
                category = 'técnica'
                confidence = 0.8
            elif any(word in text + title for word in ['estudar', 'aprender', 'curso', 'vídeo', 'livro']):
                category = 'estudo'
                confidence = 0.8
            elif any(word in text + title for word in ['reunião', 'call', 'apresentação', 'projeto']):
                category = 'trabalho'
                confidence = 0.7
            elif any(word in text + title for word in ['pessoal', 'família', 'saúde', 'exercício']):
                category = 'pessoal'
                confidence = 0.7
            
            categorized_items.append({
                'id': item.get('id'),
                'original': item,
                'suggested_category': category,
                'confidence': confidence,
                'reasoning': f'Baseado em palavras-chave relacionadas a {category}'
            })
        
        return jsonify({
            'success': True,
            'categorized_items': categorized_items,
            'total_processed': len(items)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_bp.route('/smart-summary', methods=['POST', 'OPTIONS'])
@token_required
@async_route
async def smart_summary(current_user):
    """Gera resumos inteligentes de conteúdo"""
    try:
        data = request.get_json()
        
        if not data or 'content' not in data:
            return jsonify({
                'success': False,
                'error': 'Conteúdo não fornecido'
            }), 400
        
        content = data['content']
        summary_type = data.get('type', 'general')  # general, technical, study
        max_length = data.get('max_length', 200)
        
        # Simular resumo inteligente
        # Em uma implementação real, usaria IA para gerar resumo
        words = content.split()
        if len(words) <= max_length // 5:  # Aproximadamente 5 caracteres por palavra
            summary = content
        else:
            # Resumo simples pegando primeiras e últimas frases
            sentences = content.split('.')
            if len(sentences) > 3:
                summary = '. '.join(sentences[:2] + sentences[-1:]) + '.'
            else:
                summary = content[:max_length] + '...' if len(content) > max_length else content
        
        return jsonify({
            'success': True,
            'summary': summary,
            'original_length': len(content),
            'summary_length': len(summary),
            'compression_ratio': round(len(summary) / len(content), 2),
            'type': summary_type
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_bp.route('/priority-scoring', methods=['POST', 'OPTIONS'])
@token_required
@async_route
async def priority_scoring(current_user):
    """Calcula scores de prioridade para tarefas"""
    try:
        data = request.get_json()
        
        if not data or 'tasks' not in data:
            return jsonify({
                'success': False,
                'error': 'Tarefas não fornecidas'
            }), 400
        
        tasks = data['tasks']
        user_context = data.get('context', {})
        
        scored_tasks = []
        
        for task in tasks:
            # Calcular score baseado em múltiplos fatores
            score = 50  # Score base
            
            # Fator urgência
            if task.get('due_date'):
                # Simular cálculo de urgência baseado na data
                score += 20
            
            # Fator importância
            priority = task.get('priority', 'média').lower()
            if priority == 'alta':
                score += 30
            elif priority == 'baixa':
                score -= 10
            
            # Fator esforço (menos esforço = maior score)
            estimated_time = task.get('estimated_time', 60)
            if estimated_time < 30:
                score += 15
            elif estimated_time > 120:
                score -= 15
            
            # Fator categoria
            category = task.get('category', '').lower()
            if category in user_context.get('priority_categories', []):
                score += 10
            
            # Normalizar score (0-100)
            score = max(0, min(100, score))
            
            scored_tasks.append({
                'id': task.get('id'),
                'task': task,
                'priority_score': score,
                'factors': {
                    'urgency': 'due_date' in task,
                    'importance': priority,
                    'effort': estimated_time,
                    'category_match': category in user_context.get('priority_categories', [])
                }
            })
        
        # Ordenar por score
        scored_tasks.sort(key=lambda x: x['priority_score'], reverse=True)
        
        return jsonify({
            'success': True,
            'scored_tasks': scored_tasks,
            'total_tasks': len(tasks),
            'highest_score': scored_tasks[0]['priority_score'] if scored_tasks else 0,
            'lowest_score': scored_tasks[-1]['priority_score'] if scored_tasks else 0
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_bp.route('/cache/clear', methods=['POST'])
def clear_ai_cache():
    """Limpa cache de sugestões de IA"""
    try:
        ai_service.clear_cache()
        return jsonify({
            'success': True,
            'message': 'Cache limpo com sucesso'
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@ai_bp.route('/health', methods=['GET'])
def ai_health_check():
    """Verifica status dos serviços de IA"""
    try:
        providers = ai_service.get_available_providers()
        
        health_status = {
            'status': 'healthy' if providers else 'degraded',
            'providers': providers,
            'cache_size': len(ai_service.suggestion_cache),
            'features': {
                'task_suggestions': len(providers) > 0,
                'productivity_insights': len(providers) > 0,
                'study_recommendations': len(providers) > 0,
                'schedule_optimization': len(providers) > 0,
                'smart_categorization': True,  # Sempre disponível
                'smart_summary': True,  # Sempre disponível
                'priority_scoring': True  # Sempre disponível
            }
        }
        
        return jsonify({
            'success': True,
            'health': health_status
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'health': {
                'status': 'unhealthy',
                'providers': [],
                'features': {}
            }
        }), 500

