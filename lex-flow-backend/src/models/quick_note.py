# src/models/quick_note.py

from datetime import datetime
from src import db
from sqlalchemy.orm import relationship
from sqlalchemy.types import JSON # Vamos usar JSON para armazenar a lista de tags

class QuickNote(db.Model):
    __tablename__ = 'quick_notes'

    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # NOVOS CAMPOS BASEADOS NO FRONT-END
    category = db.Column(db.String(50), nullable=False, default='general')
    tags = db.Column(JSON, nullable=True) # Armazena uma lista de strings, ex: ["trabalho", "urgente"]

    # Relacionamento explícito de volta para o User
    user = relationship('User', back_populates='quick_notes')

    def to_dict(self):
        """Converte o objeto em um dicionário para a API."""
        return {
            'id': self.id,
            'content': self.content,
            'user_id': self.user_id,
            'createdAt': self.created_at.isoformat(), # O front-end usa 'createdAt' com 'A' maiúsculo
            'category': self.category,
            'tags': self.tags or [] # Retorna uma lista vazia se as tags forem nulas
        }

    def __repr__(self):
        return f'<QuickNote {self.id}>'