# src/routes/pomodoro.py

from flask import Blueprint, jsonify, request
from src import db
from src.models.pomodoro import PomodoroSettings, PomodoroSession
from src.utils.decorators import token_required
from datetime import datetime, date

pomodoro_bp = Blueprint('pomodoro', __name__)


# Rota para buscar os dados do Pomodoro (configurações + estatísticas do dia)
@pomodoro_bp.route('/', methods=['GET'])
@token_required
def get_data(current_user):
    # Busca as configurações do usuário
    settings = PomodoroSettings.query.filter_by(user_id=current_user['id']).first()
    
    # Se o usuário não tiver configurações, cria uma com valores padrão
    if not settings:
        settings = PomodoroSettings(user_id=current_user['id'])
        db.session.add(settings)
        db.session.commit()

    # Calcula as estatísticas de hoje
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    
    sessions_completed_today = PomodoroSession.query.filter(
        PomodoroSession.user_id == current_user['id'],
        PomodoroSession.start_time >= start_of_day
    ).count()

    stats = {
        'sessionsCompletedToday': sessions_completed_today
    }

    settings_dict = {
        'workDuration': settings.focus_minutes,
        'shortBreakDuration': settings.short_break_minutes,
        'longBreakDuration': settings.long_break_minutes,
        # Você pode adicionar 'sessionsUntilLongBreak' ao seu modelo se quiser salvá-lo
        'sessionsUntilLongBreak': 4 # Valor padrão por enquanto
    }
    
    return jsonify({
        'settings': settings_dict,
        'stats': stats
    })


# Rota para salvar as configurações do usuário
@pomodoro_bp.route('/settings', methods=['POST'])
@token_required
def save_settings(current_user):
    data = request.get_json()
    settings = PomodoroSettings.query.filter_by(user_id=current_user['id']).first()

    if not settings:
        settings = PomodoroSettings(user_id=current_user['id'])
        db.session.add(settings)
    
    # Atualiza os valores com base nos dados recebidos do front-end
    settings.focus_minutes = data.get('workDuration', settings.focus_minutes)
    settings.short_break_minutes = data.get('shortBreakDuration', settings.short_break_minutes)
    settings.long_break_minutes = data.get('longBreakDuration', settings.long_break_minutes)
    # TODO: Salvar 'sessionsUntilLongBreak' no banco de dados se desejar
    
    db.session.commit()
    
    return jsonify({'message': 'Configurações salvas com sucesso!'})


# Rota para registrar uma sessão de trabalho concluída
@pomodoro_bp.route('/log-session', methods=['POST'])
@token_required
def log_session(current_user):
    settings = PomodoroSettings.query.filter_by(user_id=current_user['id']).first()
    if not settings:
        # Usa duração padrão se não houver configurações
        duration = 25
    else:
        duration = settings.focus_minutes

    new_session = PomodoroSession(
        user_id=current_user['id'],
        duration_minutes=duration
    )
    db.session.add(new_session)
    db.session.commit()
    
    return jsonify({'message': 'Sessão registrada com sucesso!'}), 201