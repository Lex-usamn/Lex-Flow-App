# src/routes/analytics.py

from flask import Blueprint, jsonify, request
from src import db
from src.utils.decorators import token_required
from datetime import datetime, timedelta, date

# Importe TODOS os modelos dos quais você precisa extrair dados
from src.models.pomodoro import PomodoroSession
from src.models.project import Task
from src.models.study_video import StudyVideo

analytics_bp = Blueprint('analytics', __name__)

# --- FUNÇÕES AUXILIARES DE CÁLCULO ---

def get_date_range(time_range_str):
    """Calcula a data de início com base no intervalo de tempo ('week', 'month', 'year')."""
    end_date = datetime.utcnow()
    if time_range_str == 'month':
        start_date = end_date - timedelta(days=30)
    elif time_range_str == 'year':
        start_date = end_date - timedelta(days=365)
    else: # 'week' é o padrão
        start_date = end_date - timedelta(days=7)
    return start_date, end_date

# --- ROTAS DA API ---

@analytics_bp.route('/', methods=['GET'])
@token_required
def get_analytics_data(current_user):
    """
    Rota principal que calcula e retorna todos os dados de análise.
    """
    time_range = request.args.get('timeRange', 'week')
    start_date, end_date = get_date_range(time_range)
    user_id = current_user['id']
    
    # 1. Dados de Pomodoro
    pomodoro_sessions = PomodoroSession.query.filter(
        PomodoroSession.user_id == user_id,
        PomodoroSession.start_time.between(start_date, end_date)
    ).all()
    
    pomodoro_stats = {}
    for session in pomodoro_sessions:
        day = session.start_time.strftime('%Y-%m-%d')
        if day not in pomodoro_stats:
            pomodoro_stats[day] = {'day': day, 'sessions': 0, 'focusTime': 0}
        pomodoro_stats[day]['sessions'] += 1
        pomodoro_stats[day]['focusTime'] += session.duration_minutes
    
    # 2. Dados de Tarefas
    tasks = Task.query.filter(
        # Supondo que Task tenha um campo 'created_by' ou similar
        # Adapte se o campo for diferente
        Task.project.has(owner_id=user_id), # Exemplo de como filtrar por tasks do usuário
        Task.completed_at.between(start_date, end_date)
    ).all()
    
    task_stats_by_cat = {}
    for task in tasks:
        category = task.category or 'Geral'
        if category not in task_stats_by_cat:
            task_stats_by_cat[category] = 0
        task_stats_by_cat[category] += 1
        
    total_tasks = sum(task_stats_by_cat.values())
    category_distribution = [
        {'category': cat, 'count': count, 'percentage': round((count / total_tasks) * 100) if total_tasks > 0 else 0}
        for cat, count in task_stats_by_cat.items()
    ]

    # 3. Dados de Estudo
    study_videos = StudyVideo.query.filter(
        StudyVideo.user_id == user_id,
        StudyVideo.updated_at.between(start_date, end_date) # Usamos updated_at para capturar quando foi concluído
    ).all()
    study_stats = [{'title': v.title, 'watched': v.status == 'Completed'} for v in study_videos]

    # 4. Tendências de Produtividade (Exemplo de cálculo)
    # Este é um cálculo complexo. Aqui está um mock simplificado.
    productivity_trends = []
    current_day = start_date
    while current_day <= end_date:
        # Lógica de mock: produtividade aumenta ao longo do tempo
        import random
        productivity_trends.append({
            'day': current_day.strftime('%Y-%m-%d'),
            'productivity': min(random.randint(50, 80) + (current_day.day % 10), 100)
        })
        current_day += timedelta(days=1)
        
    # 5. Progresso Semanal (apenas para a visão de 'semana')
    weekly_progress = []
    if time_range == 'week':
        for i in range(7):
            day_date = start_date + timedelta(days=i)
            day_str = day_date.strftime('%Y-%m-%d')
            day_name = day_date.strftime('%a') # "Seg", "Ter", etc.
            
            pomos_on_day = pomodoro_stats.get(day_str, {}).get('sessions', 0)
            tasks_on_day = len([t for t in tasks if t.completed_at and t.completed_at.strftime('%Y-%m-%d') == day_str])
            
            weekly_progress.append({
                'day': day_name,
                'pomodoros': pomos_on_day,
                'tasks': tasks_on_day
            })

    # Compila a resposta final
    final_data = {
        'pomodoroStats': list(pomodoro_stats.values()),
        'taskStats': [{'category': cat, 'count': count} for cat, count in task_stats_by_cat.items()],
        'studyStats': study_stats,
        'productivityTrends': productivity_trends,
        'categoryDistribution': category_distribution,
        'weeklyProgress': weekly_progress
    }
    
    return jsonify({'data': final_data})


@analytics_bp.route('/export', methods=['GET'])
@token_required
def export_analytics_report(current_user):
    # Esta rota pode reutilizar a lógica da rota principal
    # mas formatar os dados de forma diferente se necessário.
    
    # Por simplicidade, vamos apenas chamar a lógica anterior e retorná-la.
    # Em um app real, você poderia gerar um PDF ou CSV aqui.
    
    response = get_analytics_data.sync_do(current_user) # Chama a outra função
    data = response.get_json()
    
    return jsonify({'report': data['data']})