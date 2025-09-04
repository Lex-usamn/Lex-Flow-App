# /src/models/study_video.py

from src import db
from sqlalchemy.orm import relationship
from datetime import datetime

class StudyVideo(db.Model):
    """
    Armazena os vídeos de estudo que um usuário salvou.
    """
    __tablename__ = 'study_videos'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    video_url = db.Column(db.String(500), nullable=False)
    title = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    # Adicionando um campo de status para rastrear o progresso
    status = db.Column(db.String(50), default='To Watch', nullable=False) # Ex: 'To Watch', 'Watching', 'Completed'
    
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Aponta de volta para a propriedade 'study_videos' no modelo User
    user = relationship('User', back_populates='study_videos')

    def to_dict(self):
        """Converte o objeto em um dicionário para a API."""
        return {
            'id': self.id,
            'userId': self.user_id,
            'videoUrl': self.video_url,
            'title': self.title,
            'notes': self.notes,
            'status': self.status,
            'createdAt': self.created_at.isoformat(),
            'updatedAt': self.updated_at.isoformat()
        }