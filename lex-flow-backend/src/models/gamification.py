# /src/models/gamification.py

from src import db
from sqlalchemy.orm import relationship

class GamificationProfile(db.Model):
    """
    Armazena os dados de progresso da gamificação para cada usuário.
    Cada usuário tem um único perfil de gamificação (relação um-para-um).
    """
    __tablename__ = 'gamification_profiles'

    id = db.Column(db.Integer, primary_key=True)
    # Relação um-para-um com o usuário.
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    points = db.Column(db.Integer, default=0, nullable=False)
    level = db.Column(db.Integer, default=1, nullable=False)
    
    # Você pode adicionar mais campos conforme sua lógica de gamificação evolui.
    # Por exemplo, para rastrear sequências de dias de uso.
    current_streak = db.Column(db.Integer, default=0)
    longest_streak = db.Column(db.Integer, default=0)
    last_active_date = db.Column(db.Date)
    
    # Aponta de volta para a propriedade 'gamification_profile' no modelo User.
    user = relationship('User', back_populates='gamification_profile')

    def to_dict(self):
        """Converte o objeto em um dicionário para a API."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'points': self.points,
            'level': self.level,
            'current_streak': self.current_streak,
            'longest_streak': self.longest_streak
        }