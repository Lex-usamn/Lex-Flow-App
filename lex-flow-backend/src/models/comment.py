# lex-flow-backend/src/models/comment.py

from datetime import datetime
import json
from src import db # CORREÇÃO: Importa a instância 'db' centralizada

class Comment(db.Model):
    __tablename__ = 'comments'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    task_id = db.Column(db.Integer, db.ForeignKey('tasks.id'), nullable=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    content = db.Column(db.Text, nullable=False)
    parent_comment_id = db.Column(db.Integer, db.ForeignKey('comments.id'), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_edited = db.Column(db.Boolean, default=False)
    
    # --- CORREÇÃO AQUI ---
    extra_data = db.Column(db.Text)  # Renomeado de 'metadata'

    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'task_id': self.task_id,
            'user_id': self.user_id,
            'content': self.content,
            'parent_comment_id': self.parent_comment_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_edited': self.is_edited,
            'extra_data': json.loads(self.extra_data) if self.extra_data else {}, # Renomeado de 'metadata'
            'reply_count': len(self.replies)
        }

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)
    entity_type = db.Column(db.String(20), nullable=False)
    entity_id = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # --- CORREÇÃO AQUI ---
    extra_data = db.Column(db.Text)  # Renomeado de 'metadata'

    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'description': self.description,
            'extra_data': json.loads(self.extra_data) if self.extra_data else {}, # Renomeado de 'metadata'
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')
    is_read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    
    # --- CORREÇÃO AQUI ---
    extra_data = db.Column(db.Text)  # Renomeado de 'metadata'
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'project_id': self.project_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'action_url': self.action_url,
            'extra_data': json.loads(self.extra_data) if self.extra_data else {}, # Renomeado de 'metadata'
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None
        }
    
    def mark_as_read(self):
        self.is_read = True
        self.read_at = datetime.utcnow()

class SharedLink(db.Model):
    __tablename__ = 'shared_links'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(100), unique=True, nullable=False)
    permissions = db.Column(db.Text)
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    access_count = db.Column(db.Integer, default=0)
    last_accessed = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'created_by': self.created_by,
            'token': self.token,
            'permissions': json.loads(self.permissions) if self.permissions else {},
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            'is_active': self.is_active,
            'access_count': self.access_count,
            'last_accessed': self.last_accessed.isoformat() if self.last_accessed else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_valid(self):
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        return True
    
    def record_access(self):
        self.access_count += 1
        self.last_accessed = datetime.utcnow()