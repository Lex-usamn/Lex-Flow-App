# src/routes/gamification.py

from flask import Blueprint, jsonify
from src import db
from src.models.gamification import GamificationProfile
from src.models.project import Task
# Importe seus outros modelos (QuickNote, PomodoroSession, etc.) se você for usar.
from src.models.pomodoro import PomodoroSession
from src.utils.decorators import token_required

gamification_bp = Blueprint('gamification', __name__)

LEVEL_CONFIG = [
    (1, 0, "Iniciante"),
    (2, 100, "Aprendiz"),
    (3, 500, "Praticante"),
    (4, 1000, "Habilidoso"),
    (5, 2000, "Especialista"),
    (6, 4000, "Mestre"),
    (7, 7000, "Guru"),
    (8, 10000, "Lenda"),
]

# --- FUNÇÕES AUXILIARES ---

def calculate_progress_in_level(current_xp, next_level_xp, current_level_xp):
    """ Calcula a porcentagem de progresso no nível atual. """
    total_xp_for_level = next_level_xp - current_level_xp
    if total_xp_for_level <= 0:
        return 100
    
    xp_in_current_level = current_xp - current_level_xp
    return min((xp_in_current_level / total_xp_for_level) * 100, 100)


def get_level_details(total_points):
    """ Determina o nível e o nome do nível baseado nos pontos totais. """
    # ===> MUDANÇA 2: A FUNÇÃO AGORA USA A CONSTANTE GLOBAL <===
    for level, points_needed, level_name in reversed(LEVEL_CONFIG):
        if total_points >= points_needed:
            return level, level_name, points_needed
    return 1, "Iniciante", 0

# --- ROTAS DA API ---

# Rota para buscar dados de gamificação
@gamification_bp.route('/', methods=['GET'])
@token_required
def get_gamification_data(current_user):
    profile = GamificationProfile.query.filter_by(user_id=current_user['id']).first()
    
    # Se não houver perfil, cria um novo.  Isso é importante para não ter erros
    if not profile:
        profile = GamificationProfile(user_id=current_user['id'])
        db.session.add(profile)
        db.session.commit()
    
    total_points = profile.points

    # Calcula o nível atual
    level, level_name, current_level_xp = get_level_details(total_points)
    # Determina o XP necessário para o próximo nível
    next_level_xp = 0
    for lvl, xp, name in LEVEL_CONFIG:
        if lvl == level + 1:
            next_level_xp = xp
            break
    
    # Calcula o progresso no nível atual
    progress_in_level = calculate_progress_in_level(total_points, next_level_xp, current_level_xp) if next_level_xp > 0 else 100
        
    # Exemplo de cálculo de conquistas.  Você precisa implementar sua lógica aqui.
    # Este é um exemplo SIMPLES e NÃO COMPLETO.
    achievements_count = 0 # profile.achievements.count() # TODO: Implementar o relacionamento entre GamificationProfile e Achievement
    # Calcula o número de tarefas concluídas hoje
    from datetime import date, datetime
    today = date.today()
    start_of_day = datetime.combine(today, datetime.min.time())
    tasks_completed_today = Task.query.filter(
        Task.created_by == current_user['id'],
        Task.completed_at >= start_of_day
    ).count()

    # Calcula o número de pomodoros concluidos hoje
    sessions_completed_today = PomodoroSession.query.filter(
        PomodoroSession.user_id == current_user['id'],
        PomodoroSession.start_time >= start_of_day
    ).count()
    

    progress_data = {
        'level': level,
        'levelName': level_name,
        'totalPoints': total_points,
        'progressInLevel': int(progress_in_level),
        'experience': total_points,
        'nextLevelXP': next_level_xp or total_points,
        'achievements': achievements_count, # Use profile.achievements.count() no futuro
        'currentStreak': 0, # TODO: Implementar cálculo de sequência
        'longestStreak': 0 # TODO: Implementar cálculo de sequência
    }
    
    #  Exemplo de dados de conquistas (precisa ser preenchido com seus dados)
    mock_achievements = [
        # ...  adicione aqui as conquistas que você deseja retornar ...
    ]
    
    leaderboard_data = [
        {'name': 'Você', 'level': level, 'points': total_points},
        {'name': 'UsuárioA', 'level': 5, 'points': 2500},
        {'name': 'UsuárioB', 'level': 3, 'points': 800},
    ]

    return jsonify({
        'progress': progress_data,
        'achievements': mock_achievements,
        'leaderboard': leaderboard_data
    })

# Rota para resetar o progresso da gamificação (apenas para testes)
@gamification_bp.route('/reset', methods=['POST'])
@token_required
def reset_progress(current_user):
    profile = GamificationProfile.query.filter_by(user_id=current_user['id']).first_or_404()
    profile.points = 0
    db.session.commit()
    return jsonify({'message': 'Progresso resetado com sucesso!'}), 200

# Rota para exportar os dados da gamificação (exemplo)
@gamification_bp.route('/export', methods=['GET'])
@token_required
def export_data(current_user):
    profile = GamificationProfile.query.filter_by(user_id=current_user['id']).first_or_404()
    # Adapte a lógica para retornar os dados no formato que você precisa.
    data = {
        'progress': {
            'level': profile.level,
            'points': profile.points
        },
        # ... Adicione as conquistas e outros dados que você quer exportar ...
    }
    return jsonify({'data': data})