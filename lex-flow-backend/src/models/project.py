from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import json

db = SQLAlchemy()

class Project(db.Model):
    __tablename__ = 'projects'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False)
    settings = db.Column(db.Text)  # JSON string for project settings
    
    # Relacionamentos
    tasks = db.relationship('Task', backref='project', lazy=True, cascade='all, delete-orphan')
    collaborators = db.relationship('ProjectCollaborator', backref='project', lazy=True, cascade='all, delete-orphan')
    
    def __init__(self, name, description, owner_id, is_public=False, settings=None):
        self.name = name
        self.description = description
        self.owner_id = owner_id
        self.is_public = is_public
        self.settings = json.dumps(settings) if settings else json.dumps({})
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'owner_id': self.owner_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_public': self.is_public,
            'settings': json.loads(self.settings) if self.settings else {},
            'task_count': len(self.tasks),
            'collaborator_count': len(self.collaborators)
        }
    
    def get_task_metadata(self):
        return json.loads(self.task_metadata) if self.task_metadata else {}
    
    def update_task_metadata(self, new_metadata):
        current_metadata = self.get_task_metadata()
        current_metadata.update(new_metadata)
        self.task_metadata = json.dumps(current_metadata)

class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    assigned_to = db.Column(db.Integer, db.ForeignKey('users.id'))
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # pending, in_progress, completed, cancelled
    priority = db.Column(db.String(10), default='medium')  # low, medium, high, urgent
    category = db.Column(db.String(50), default='general')  # technical, priority, study, general
    due_date = db.Column(db.DateTime)
    completed_at = db.Column(db.DateTime)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    tags = db.Column(db.Text)  # JSON array of tags
    task_metadata = db.Column(db.Text)  # JSON for additional task data   
    def __init__(self, title, project_id, created_by, description=None, assigned_to=None, 
                 status='pending', priority='medium', category='general', due_date=None, tags=None, task_metadata=None):
        self.title = title
        self.description = description
        self.project_id = project_id
        self.assigned_to = assigned_to
        self.created_by = created_by
        self.status = status
        self.priority = priority
        self.category = category
        self.due_date = due_date
        self.tags = json.dumps(tags) if tags else json.dumps([])
        self.task_metadata = json.dumps(task_metadata) if task_metadata else json.dumps({})
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'project_id': self.project_id,
            'assigned_to': self.assigned_to,
            'created_by': self.created_by,
            'status': self.status,
            'priority': self.priority,
            'category': self.category,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'tags': json.loads(self.tags) if self.tags else [],
            'task_metadata': json.loads(self.task_metadata) if self.task_metadata else {}
        }
    
    def complete(self):
        self.status = 'completed'
        self.completed_at = datetime.utcnow()
    
    def get_tags(self):
        return json.loads(self.tags) if self.tags else []
    
    def add_tag(self, tag):
        tags = self.get_tags()
        if tag not in tags:
            tags.append(tag)
            self.tags = json.dumps(tags)

class ProjectCollaborator(db.Model):
    __tablename__ = 'project_collaborators'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.String(20), default='member')  # owner, admin, member, viewer
    permissions = db.Column(db.Text)  # JSON for specific permissions
    invited_by = db.Column(db.Integer, db.ForeignKey('users.id'))
    invited_at = db.Column(db.DateTime, default=datetime.utcnow)
    accepted_at = db.Column(db.DateTime)
    status = db.Column(db.String(20), default='pending')  # pending, accepted, declined, removed
    
    # Constraint para evitar duplicatas
    __table_args__ = (db.UniqueConstraint('project_id', 'user_id', name='unique_project_user'),)
    
    def __init__(self, project_id, user_id, role='member', permissions=None, invited_by=None):
        self.project_id = project_id
        self.user_id = user_id
        self.role = role
        self.permissions = json.dumps(permissions) if permissions else json.dumps({})
        self.invited_by = invited_by
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'role': self.role,
            'permissions': json.loads(self.permissions) if self.permissions else {},
            'invited_by': self.invited_by,
            'invited_at': self.invited_at.isoformat() if self.invited_at else None,
            'accepted_at': self.accepted_at.isoformat() if self.accepted_at else None,
            'status': self.status
        }
    
    def accept_invitation(self):
        self.status = 'accepted'
        self.accepted_at = datetime.utcnow()
    
    def get_permissions(self):
        return json.loads(self.permissions) if self.permissions else {}

class CloudSync(db.Model):
    __tablename__ = 'cloud_sync'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    provider = db.Column(db.String(20), nullable=False)  # google_drive, dropbox, onedrive
    provider_user_id = db.Column(db.String(100))
    access_token = db.Column(db.Text)  # Encrypted
    refresh_token = db.Column(db.Text)  # Encrypted
    token_expires_at = db.Column(db.DateTime)
    sync_enabled = db.Column(db.Boolean, default=True)
    last_sync = db.Column(db.DateTime)
    sync_status = db.Column(db.String(20), default='pending')  # pending, syncing, completed, error
    sync_settings = db.Column(db.Text)  # JSON for sync preferences
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __init__(self, user_id, provider, access_token=None, refresh_token=None, 
                 provider_user_id=None, sync_settings=None):
        self.user_id = user_id
        self.provider = provider
        self.access_token = access_token
        self.refresh_token = refresh_token
        self.provider_user_id = provider_user_id
        self.sync_settings = json.dumps(sync_settings) if sync_settings else json.dumps({})
    
    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'provider': self.provider,
            'provider_user_id': self.provider_user_id,
            'sync_enabled': self.sync_enabled,
            'last_sync': self.last_sync.isoformat() if self.last_sync else None,
            'sync_status': self.sync_status,
            'sync_settings': json.loads(self.sync_settings) if self.sync_settings else {},
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def get_sync_settings(self):
        return json.loads(self.sync_settings) if self.sync_settings else {}
    
    def update_sync_status(self, status):
        self.sync_status = status
        if status == 'completed':
            self.last_sync = datetime.utcnow()

