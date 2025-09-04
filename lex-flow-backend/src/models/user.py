# lex-flow-backend/src/models/user.py

from src import db 
from sqlalchemy.orm import relationship
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime, timedelta, timezone
import jwt
import os
# ====> 1. DEFINA A TABELA DE ASSOCIAÇÃO AQUI <====
# Esta não é uma classe de modelo, mas uma tabela auxiliar para o relacionamento M-M.
user_projects = db.Table('user_projects',
    db.Column('user_id', db.Integer, db.ForeignKey('users.id'), primary_key=True),
    db.Column('project_id', db.Integer, db.ForeignKey('projects.id'), primary_key=True)
)


class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    updated_at = db.Column(db.DateTime, default=db.func.current_timestamp(), onupdate=db.func.current_timestamp())
    
    # --- CORREÇÃO 2: Adicionando as colunas que estavam faltando ---
    is_active = db.Column(db.Boolean, default=True, nullable=False)
    last_login = db.Column(db.DateTime, nullable=True)

    # --- RELACIONAMENTOS ---
    tenant = db.relationship('Tenant', back_populates='users')
    projects = relationship('Project', secondary=user_projects, back_populates='users')
    quick_notes = relationship('QuickNote', back_populates='user', cascade='all, delete-orphan')
    pomodoro_settings = relationship('PomodoroSettings', back_populates='user', uselist=False, cascade='all, delete-orphan')
    pomodoro_sessions = relationship('PomodoroSession', back_populates='user', cascade='all, delete-orphan')
    gamification_profile = relationship('GamificationProfile', back_populates='user', uselist=False, cascade='all, delete-orphan')
    integrations = relationship('Integration', back_populates='user', uselist=False, cascade='all, delete-orphan')
    study_videos = relationship('StudyVideo', back_populates='user', cascade='all, delete-orphan')

    cloud_connections = relationship('CloudSync', back_populates='user', cascade='all, delete-orphan')

    # Relacionamentos explícitos com os modelos TELOS (isto está correto)
    telos_framework = relationship('TelosFramework', back_populates='user', uselist=False, cascade='all, delete-orphan')
    telos_reviews = relationship('TelosReview', back_populates='user', cascade='all, delete-orphan')
    
    # --- CORREÇÃO 1: Corrigindo a indentação dos métodos ---
    # Todos os 'def' devem começar no mesmo nível da classe, sem indentação extra.
    def set_password(self, password):
        """Criptografa e armazena a senha."""
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        """Verifica se a senha fornecida corresponde à senha armazenada."""
        return check_password_hash(self.password_hash, password)

    def generate_token(self):
        """Gera um token JWT para o usuário, válido por 24 horas."""
        payload = {
            'user_id': self.id,
            'username': self.username,
            'tenant_id': self.tenant_id,
            'exp': datetime.now(timezone.utc) + timedelta(days=1)
        }
        return jwt.encode(payload, os.environ.get('SECRET_KEY', 'default-secret'), algorithm='HS256')

    @staticmethod
    def verify_token(token):
        """Verifica um token JWT e retorna o usuário correspondente."""
        try:
            payload = jwt.decode(token, os.environ.get('SECRET_KEY', 'default-secret'), algorithms=['HS256'])
            return User.query.get(payload['user_id'])
        except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
            return None

    def to_dict(self):
        """Retorna uma representação do usuário em formato de dicionário."""
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'is_active': self.is_active,
            'tenant_id': self.tenant_id
        }

    def __repr__(self):
        return f'<User {self.username}>'