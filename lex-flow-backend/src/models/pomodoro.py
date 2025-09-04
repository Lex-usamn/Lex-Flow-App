# /src/models/pomodoro.py

from src import db
from sqlalchemy.orm import relationship
from datetime import datetime

class PomodoroSettings(db.Model):
    """
    Armazena as configurações personalizadas do timer Pomodoro para cada usuário.
    Cada usuário tem apenas um registro de configurações (relação um-para-um).
    """
    __tablename__ = 'pomodoro_settings'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # Duração em minutos
    focus_minutes = db.Column(db.Integer, default=25, nullable=False)
    short_break_minutes = db.Column(db.Integer, default=5, nullable=False)
    long_break_minutes = db.Column(db.Integer, default=15, nullable=False)
    sessions_until_long_break = db.Column(db.Integer, default=4, nullable=False)
    
    # Aponta de volta para a propriedade 'pomodoro_settings' no modelo User
    user = relationship('User', back_populates='pomodoro_settings')

class PomodoroSession(db.Model):
    """
    Registra cada sessão de trabalho Pomodoro concluída por um usuário.
    Usado para gerar estatísticas.
    """
    __tablename__ = 'pomodoro_sessions'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    start_time = db.Column(db.DateTime, default=datetime.utcnow)
    duration_minutes = db.Column(db.Integer, nullable=False)
    
    # Aponta de volta para a propriedade 'pomodoro_sessions' no modelo User
    user = relationship('User', back_populates='pomodoro_sessions')