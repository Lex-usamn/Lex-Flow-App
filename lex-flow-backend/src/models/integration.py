# /src/models/integration.py - VERSÃO CORRIGIDA E SIMPLIFICADA

from src import db
from sqlalchemy.orm import relationship
# [REMOVIDO] Não precisamos mais de importações específicas de dialeto.
# from sqlalchemy.dialects.postgresql import JSONB 
# from sqlalchemy.types import JSON as JSON_TYPE

class Integration(db.Model):
    """
    Armazena todas as configurações de integrações para um único usuário.
    Cada usuário terá no máximo um registro nesta tabela, contendo um objeto JSON
    com todas as credenciais e alvos de sincronização.
    """
    __tablename__ = 'integrations'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), unique=True, nullable=False)
    
    # [CORREÇÃO] Usamos o tipo genérico db.JSON. 
    # O SQLAlchemy se encarregará de usar o tipo de dados correto para o banco de dados
    # que está sendo usado (TEXT para SQLite, JSON nativo para PostgreSQL, etc.).
    configs = db.Column(db.JSON, nullable=True)

    user = relationship('User', back_populates='integrations')

    def to_dict(self):
        """Converte o objeto em um dicionário para a API."""
        return {
            'id': self.id,
            'user_id': self.user_id,
            'configs': self.configs or {}
        }