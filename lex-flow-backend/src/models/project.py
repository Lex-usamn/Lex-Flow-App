# /src/models/project.py

from datetime import datetime
import json
from src import db 
from sqlalchemy.orm import relationship

# -------------------------------------------------
# Modelo para Projetos
# -------------------------------------------------
class Project(db.Model):
    __tablename__ = 'projects'
    
    # --- Colunas ---
    # (Todas devem estar neste nível de indentação)
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    tenant_id = db.Column(db.Integer, db.ForeignKey('tenants.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_public = db.Column(db.Boolean, default=False, nullable=False)

    # --- Relacionamentos ---
    # (Também neste nível de indentação)
    users = relationship('User', secondary='user_projects', back_populates='projects')
    tasks = relationship('Task', back_populates='project', cascade='all, delete-orphan')
    collaborators = relationship('ProjectCollaborator', back_populates='project', cascade='all, delete-orphan')

    # --- MÉTODOS ---
    # (A definição 'def' começa neste nível de indentação)
    def __init__(self, name, owner_id, tenant_id, description=None, is_public=False):
        # O conteúdo do método é indentado mais uma vez
        """Construtor da classe Project."""
        self.name = name
        self.owner_id = owner_id
        self.tenant_id = tenant_id
        self.description = description
        self.is_public = is_public
    
    def to_dict(self):
        # O conteúdo do método é indentado mais uma vez
        """Converte o objeto em um dicionário para a API."""
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'owner_id': self.owner_id,
            'tenant_id': self.tenant_id,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'is_public': self.is_public,
            'task_count': len(self.tasks),
            'collaborator_count': len(self.collaborators)
        }


# -------------------------------------------------
# Modelo para Tarefas
# -------------------------------------------------
class Task(db.Model):
    __tablename__ = 'tasks'
    
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    created_by = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')
    category = db.Column(db.String(50), default='general')
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    completed_at = db.Column(db.DateTime, nullable=True)  

    # --- RELACIONAMENTO CORRIGIDO ---
    # Aponta de volta para a propriedade 'tasks' no modelo Project.
    project = relationship('Project', back_populates='tasks')
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'project_id': self.project_id,
            'status': self.status,
            'category': self.category,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
        }
    
# -------------------------------------------------
# Modelo para Colaboradores de Projeto
# -------------------------------------------------
class ProjectCollaborator(db.Model):
    __tablename__ = 'project_collaborators'
    
    id = db.Column(db.Integer, primary_key=True)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    role = db.Column(db.String(20), default='member')
    status = db.Column(db.String(20), default='pending') # ex: 'pending', 'accepted'
    
    # --- RELACIONAMENTO CORRIGIDO ---
    # Aponta de volta para a propriedade 'collaborators' no modelo Project.
    project = relationship('Project', back_populates='collaborators')
    
    __table_args__ = (db.UniqueConstraint('project_id', 'user_id', name='unique_project_user'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'project_id': self.project_id,
            'user_id': self.user_id,
            'role': self.role,
            'status': self.status
        }