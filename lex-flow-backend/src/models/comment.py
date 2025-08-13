from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

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
    metadata = db.Column(db.Text)  # JSON for additional data like mentions, attachments
    
    # Relacionamentos
    replies = db.relationship('Comment', backref=db.backref('parent', remote_side=[id]), lazy=True)
    
    def __init__(self, project_id, user_id, content, task_id=None, parent_comment_id=None, metadata=None):
        self.project_id = project_id
        self.task_id = task_id
        self.user_id = user_id
        self.content = content
        self.parent_comment_id = parent_comment_id
        self.metadata = json.dumps(metadata) if metadata else json.dumps({})
    
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
            'metadata': json.loads(self.metadata) if self.metadata else {},
            'reply_count': len(self.replies)
        }
    
    def get_metadata(self):
        return json.loads(self.metadata) if self.metadata else {}
    
    def update_metadata(self, new_metadata):
        current_metadata = self.get_metadata()
        current_metadata.update(new_metadata)
        self.metadata = json.dumps(current_metadata)

class ActivityLog(db.Model):
    __tablename__ = 'activity_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    action = db.Column(db.String(50), nullable=False)  # created, updated, deleted, commented, etc.
    entity_type = db.Column(db.String(20), nullable=False)  # project, task, comment
    entity_id = db.Column(db.Integer, nullable=False)
    description = db.Column(db.Text)
    metadata = db.Column(db.Text)  # JSON for additional context
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, project_id, user_id, action, entity_type, entity_id, description=None, metadata=None):
        self.project_id = project_id
        self.user_id = user_id
        self.action = action
        self.entity_type = entity_type
        self.entity_id = entity_id
        self.description = description
        self.metadata = json.dumps(metadata) if metadata else json.dumps({})
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'action': self.action,
            'entity_type': self.entity_type,
            'entity_id': self.entity_id,
            'description': self.description,
            'metadata': json.loads(self.metadata) if self.metadata else {},
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Notification(db.Model):
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=True)
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    type = db.Column(db.String(20), default='info')  # info, warning, success, error
    is_read = db.Column(db.Boolean, default=False)
    action_url = db.Column(db.String(500))  # URL para ação relacionada
    metadata = db.Column(db.Text)  # JSON for additional data
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    read_at = db.Column(db.DateTime)
    
    def __init__(self, user_id, title, message, project_id=None, type='info', action_url=None, metadata=None):
        self.user_id = user_id
        self.project_id = project_id
        self.title = title
        self.message = message
        self.type = type
        self.action_url = action_url
        self.metadata = json.dumps(metadata) if metadata else json.dumps({})
    
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
            'metadata': json.loads(self.metadata) if self.metadata else {},
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
    permissions = db.Column(db.Text)  # JSON for permissions
    expires_at = db.Column(db.DateTime)
    is_active = db.Column(db.Boolean, default=True)
    access_count = db.Column(db.Integer, default=0)
    last_accessed = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def __init__(self, project_id, created_by, token, permissions=None, expires_at=None):
        self.project_id = project_id
        self.created_by = created_by
        self.token = token
        self.permissions = json.dumps(permissions) if permissions else json.dumps({'read': True})
        self.expires_at = expires_at
    
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
        """Verifica se o link ainda é válido"""
        if not self.is_active:
            return False
        
        if self.expires_at and self.expires_at < datetime.utcnow():
            return False
        
        return True
    
    def record_access(self):
        """Registra acesso ao link"""
        self.access_count += 1
        self.last_accessed = datetime.utcnow()
    
    def get_permissions(self):
        return json.loads(self.permissions) if self.permissions else {}

