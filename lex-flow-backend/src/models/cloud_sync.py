# src/models/cloud_sync.py

from datetime import datetime
from src import db
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON

class CloudSync(db.Model):
    __tablename__ = 'cloud_sync'
    
    id = db.Column(db.Integer, primary_key=True)
    # Relação um-para-MUITOS com User, pois um usuário pode ter múltiplas conexões (Google, Dropbox, etc.)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    # Campos necessários para as rotas
    provider = db.Column(db.String(50), nullable=False) # Ex: 'google_drive', 'dropbox'
    provider_user_id = db.Column(db.String(100)) # ID do usuário no serviço externo
    access_token = db.Column(db.Text, nullable=False)
    refresh_token = db.Column(db.Text)
    token_expires_at = db.Column(db.DateTime)
    sync_enabled = db.Column(db.Boolean, default=True)
    last_sync = db.Column(db.DateTime)
    sync_status = db.Column(db.String(20), default='idle') # Ex: 'idle', 'syncing', 'error', 'completed'
    sync_settings = db.Column(JSON) # Configurações extras
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamento explícito de volta para o User
    user = relationship('User', back_populates='cloud_connections')

    def to_dict(self):
        """Converte o objeto em um dicionário para a API."""
        return {
            'id': self.id,
            'provider': self.provider,
            'provider_user_id': self.provider_user_id,
            'sync_enabled': self.sync_enabled,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'sync_status': self.sync_status
        }