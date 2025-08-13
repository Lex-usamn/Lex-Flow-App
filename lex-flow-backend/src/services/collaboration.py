from flask_socketio import SocketIO, emit, join_room, leave_room, rooms
from datetime import datetime
import json
from typing import Dict, List, Any, Optional
import uuid

class CollaborationService:
    """Serviço para gerenciar colaboração em tempo real"""
    
    def __init__(self, socketio: SocketIO):
        self.socketio = socketio
        self.active_sessions = {}  # session_id -> session_data
        self.user_sessions = {}    # user_id -> session_id
        self.project_rooms = {}    # project_id -> list of user_ids
        
        # Registrar eventos do SocketIO
        self.register_events()
    
    def register_events(self):
        """Registra eventos do SocketIO"""
        
        @self.socketio.on('connect')
        def handle_connect(auth):
            """Usuário conectou"""
            print(f"User connected: {auth}")
            
        @self.socketio.on('disconnect')
        def handle_disconnect():
            """Usuário desconectou"""
            self.handle_user_disconnect()
            
        @self.socketio.on('join_project')
        def handle_join_project(data):
            """Usuário entrou em um projeto"""
            self.join_project_room(data)
            
        @self.socketio.on('leave_project')
        def handle_leave_project(data):
            """Usuário saiu de um projeto"""
            self.leave_project_room(data)
            
        @self.socketio.on('task_update')
        def handle_task_update(data):
            """Atualização de tarefa em tempo real"""
            self.broadcast_task_update(data)
            
        @self.socketio.on('project_update')
        def handle_project_update(data):
            """Atualização de projeto em tempo real"""
            self.broadcast_project_update(data)
            
        @self.socketio.on('user_typing')
        def handle_user_typing(data):
            """Usuário está digitando"""
            self.broadcast_typing_status(data)
            
        @self.socketio.on('cursor_position')
        def handle_cursor_position(data):
            """Posição do cursor do usuário"""
            self.broadcast_cursor_position(data)
            
        @self.socketio.on('comment_added')
        def handle_comment_added(data):
            """Comentário adicionado"""
            self.broadcast_comment(data)
    
    def join_project_room(self, data: Dict[str, Any]):
        """Adiciona usuário a uma sala de projeto"""
        user_id = data.get('user_id')
        project_id = data.get('project_id')
        user_name = data.get('user_name', f'User {user_id}')
        
        if not user_id or not project_id:
            emit('error', {'message': 'user_id and project_id required'})
            return
        
        room_name = f"project_{project_id}"
        join_room(room_name)
        
        # Adicionar à lista de usuários ativos no projeto
        if project_id not in self.project_rooms:
            self.project_rooms[project_id] = []
        
        if user_id not in self.project_rooms[project_id]:
            self.project_rooms[project_id].append(user_id)
        
        # Notificar outros usuários
        emit('user_joined', {
            'user_id': user_id,
            'user_name': user_name,
            'project_id': project_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name, include_self=False)
        
        # Enviar lista de usuários ativos para o usuário que entrou
        active_users = self.get_active_users_in_project(project_id)
        emit('active_users', {
            'project_id': project_id,
            'users': active_users
        })
        
        print(f"User {user_id} joined project {project_id}")
    
    def leave_project_room(self, data: Dict[str, Any]):
        """Remove usuário de uma sala de projeto"""
        user_id = data.get('user_id')
        project_id = data.get('project_id')
        
        if not user_id or not project_id:
            return
        
        room_name = f"project_{project_id}"
        leave_room(room_name)
        
        # Remover da lista de usuários ativos
        if project_id in self.project_rooms and user_id in self.project_rooms[project_id]:
            self.project_rooms[project_id].remove(user_id)
        
        # Notificar outros usuários
        emit('user_left', {
            'user_id': user_id,
            'project_id': project_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name)
        
        print(f"User {user_id} left project {project_id}")
    
    def handle_user_disconnect(self):
        """Trata desconexão do usuário"""
        # Remover usuário de todas as salas
        user_rooms = rooms()
        for room in user_rooms:
            if room.startswith('project_'):
                project_id = room.replace('project_', '')
                # Notificar outros usuários na sala
                emit('user_disconnected', {
                    'project_id': project_id,
                    'timestamp': datetime.utcnow().isoformat()
                }, room=room)
    
    def broadcast_task_update(self, data: Dict[str, Any]):
        """Transmite atualização de tarefa para todos os colaboradores"""
        project_id = data.get('project_id')
        task_data = data.get('task')
        user_id = data.get('user_id')
        action = data.get('action', 'update')  # create, update, delete
        
        if not project_id or not task_data:
            emit('error', {'message': 'project_id and task data required'})
            return
        
        room_name = f"project_{project_id}"
        
        # Transmitir para todos os usuários na sala, exceto o remetente
        emit('task_updated', {
            'project_id': project_id,
            'task': task_data,
            'action': action,
            'updated_by': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name, include_self=False)
    
    def broadcast_project_update(self, data: Dict[str, Any]):
        """Transmite atualização de projeto para todos os colaboradores"""
        project_id = data.get('project_id')
        project_data = data.get('project')
        user_id = data.get('user_id')
        action = data.get('action', 'update')
        
        if not project_id or not project_data:
            emit('error', {'message': 'project_id and project data required'})
            return
        
        room_name = f"project_{project_id}"
        
        emit('project_updated', {
            'project_id': project_id,
            'project': project_data,
            'action': action,
            'updated_by': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name, include_self=False)
    
    def broadcast_typing_status(self, data: Dict[str, Any]):
        """Transmite status de digitação"""
        project_id = data.get('project_id')
        user_id = data.get('user_id')
        is_typing = data.get('is_typing', False)
        element_id = data.get('element_id')  # ID do elemento sendo editado
        
        if not project_id or not user_id:
            return
        
        room_name = f"project_{project_id}"
        
        emit('user_typing_status', {
            'project_id': project_id,
            'user_id': user_id,
            'is_typing': is_typing,
            'element_id': element_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name, include_self=False)
    
    def broadcast_cursor_position(self, data: Dict[str, Any]):
        """Transmite posição do cursor"""
        project_id = data.get('project_id')
        user_id = data.get('user_id')
        position = data.get('position')  # {x, y, element_id}
        
        if not project_id or not user_id or not position:
            return
        
        room_name = f"project_{project_id}"
        
        emit('cursor_position_update', {
            'project_id': project_id,
            'user_id': user_id,
            'position': position,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name, include_self=False)
    
    def broadcast_comment(self, data: Dict[str, Any]):
        """Transmite novo comentário"""
        project_id = data.get('project_id')
        comment_data = data.get('comment')
        user_id = data.get('user_id')
        
        if not project_id or not comment_data:
            emit('error', {'message': 'project_id and comment data required'})
            return
        
        room_name = f"project_{project_id}"
        
        emit('comment_added', {
            'project_id': project_id,
            'comment': comment_data,
            'added_by': user_id,
            'timestamp': datetime.utcnow().isoformat()
        }, room=room_name)
    
    def get_active_users_in_project(self, project_id: str) -> List[Dict[str, Any]]:
        """Retorna lista de usuários ativos em um projeto"""
        if project_id not in self.project_rooms:
            return []
        
        # Em uma implementação real, buscar dados dos usuários do banco
        active_users = []
        for user_id in self.project_rooms[project_id]:
            active_users.append({
                'user_id': user_id,
                'user_name': f'User {user_id}',  # Buscar do banco
                'status': 'online',
                'last_seen': datetime.utcnow().isoformat()
            })
        
        return active_users
    
    def send_notification(self, user_id: str, notification: Dict[str, Any]):
        """Envia notificação para usuário específico"""
        # Encontrar sessão do usuário
        if user_id in self.user_sessions:
            session_id = self.user_sessions[user_id]
            self.socketio.emit('notification', notification, room=session_id)
    
    def broadcast_to_project(self, project_id: str, event: str, data: Dict[str, Any]):
        """Transmite evento para todos os usuários de um projeto"""
        room_name = f"project_{project_id}"
        self.socketio.emit(event, data, room=room_name)

class CommentService:
    """Serviço para gerenciar comentários em projetos e tarefas"""
    
    def __init__(self, db):
        self.db = db
    
    def add_comment(self, project_id: int, task_id: int, user_id: int, 
                   content: str, parent_comment_id: int = None) -> Dict[str, Any]:
        """Adiciona comentário a uma tarefa"""
        from src.models.project import Comment
        
        comment = Comment(
            project_id=project_id,
            task_id=task_id,
            user_id=user_id,
            content=content,
            parent_comment_id=parent_comment_id
        )
        
        self.db.session.add(comment)
        self.db.session.commit()
        
        return comment.to_dict()
    
    def get_comments(self, task_id: int) -> List[Dict[str, Any]]:
        """Retorna comentários de uma tarefa"""
        from src.models.project import Comment
        
        comments = Comment.query.filter_by(task_id=task_id).order_by(Comment.created_at).all()
        return [comment.to_dict() for comment in comments]
    
    def update_comment(self, comment_id: int, user_id: int, content: str) -> Dict[str, Any]:
        """Atualiza comentário"""
        from src.models.project import Comment
        
        comment = Comment.query.get(comment_id)
        if not comment:
            raise ValueError("Comment not found")
        
        if comment.user_id != user_id:
            raise ValueError("Not authorized to edit this comment")
        
        comment.content = content
        comment.updated_at = datetime.utcnow()
        self.db.session.commit()
        
        return comment.to_dict()
    
    def delete_comment(self, comment_id: int, user_id: int) -> bool:
        """Deleta comentário"""
        from src.models.project import Comment
        
        comment = Comment.query.get(comment_id)
        if not comment:
            return False
        
        if comment.user_id != user_id:
            raise ValueError("Not authorized to delete this comment")
        
        self.db.session.delete(comment)
        self.db.session.commit()
        
        return True

class PermissionService:
    """Serviço para gerenciar permissões de colaboração"""
    
    def __init__(self, db):
        self.db = db
    
    def check_project_permission(self, user_id: int, project_id: int, 
                                permission: str) -> bool:
        """Verifica se usuário tem permissão específica no projeto"""
        from src.models.project import Project, ProjectCollaborator
        
        # Verificar se é o dono do projeto
        project = Project.query.get(project_id)
        if project and project.owner_id == user_id:
            return True
        
        # Verificar permissões de colaborador
        collaborator = ProjectCollaborator.query.filter_by(
            project_id=project_id,
            user_id=user_id,
            status='accepted'
        ).first()
        
        if not collaborator:
            return False
        
        # Verificar permissões baseadas no papel
        role_permissions = {
            'owner': ['read', 'write', 'delete', 'manage', 'invite'],
            'admin': ['read', 'write', 'delete', 'invite'],
            'member': ['read', 'write'],
            'viewer': ['read']
        }
        
        user_permissions = role_permissions.get(collaborator.role, [])
        return permission in user_permissions
    
    def get_user_projects(self, user_id: int) -> List[Dict[str, Any]]:
        """Retorna projetos que o usuário tem acesso"""
        from src.models.project import Project, ProjectCollaborator
        
        # Projetos próprios
        own_projects = Project.query.filter_by(owner_id=user_id).all()
        
        # Projetos colaborativos
        collaborations = ProjectCollaborator.query.filter_by(
            user_id=user_id,
            status='accepted'
        ).all()
        
        collaborative_projects = []
        for collab in collaborations:
            project = Project.query.get(collab.project_id)
            if project:
                project_dict = project.to_dict()
                project_dict['role'] = collab.role
                project_dict['permissions'] = collab.get_permissions()
                collaborative_projects.append(project_dict)
        
        # Combinar e retornar
        all_projects = []
        
        for project in own_projects:
            project_dict = project.to_dict()
            project_dict['role'] = 'owner'
            project_dict['permissions'] = ['read', 'write', 'delete', 'manage', 'invite']
            all_projects.append(project_dict)
        
        all_projects.extend(collaborative_projects)
        
        return all_projects
    
    def invite_collaborator(self, project_id: int, inviter_id: int, 
                          invitee_email: str, role: str = 'member') -> Dict[str, Any]:
        """Convida colaborador para projeto"""
        from src.models.project import ProjectCollaborator
        from src.models.user import User
        
        # Verificar se quem convida tem permissão
        if not self.check_project_permission(inviter_id, project_id, 'invite'):
            raise ValueError("Not authorized to invite collaborators")
        
        # Buscar usuário pelo email
        invitee = User.query.filter_by(email=invitee_email).first()
        if not invitee:
            raise ValueError("User not found")
        
        # Verificar se já é colaborador
        existing = ProjectCollaborator.query.filter_by(
            project_id=project_id,
            user_id=invitee.id
        ).first()
        
        if existing:
            raise ValueError("User is already a collaborator")
        
        # Criar convite
        collaborator = ProjectCollaborator(
            project_id=project_id,
            user_id=invitee.id,
            role=role,
            invited_by=inviter_id
        )
        
        self.db.session.add(collaborator)
        self.db.session.commit()
        
        return collaborator.to_dict()
    
    def accept_invitation(self, invitation_id: int, user_id: int) -> Dict[str, Any]:
        """Aceita convite de colaboração"""
        from src.models.project import ProjectCollaborator
        
        invitation = ProjectCollaborator.query.get(invitation_id)
        if not invitation:
            raise ValueError("Invitation not found")
        
        if invitation.user_id != user_id:
            raise ValueError("Not authorized to accept this invitation")
        
        if invitation.status != 'pending':
            raise ValueError("Invitation is not pending")
        
        invitation.accept_invitation()
        self.db.session.commit()
        
        return invitation.to_dict()
    
    def remove_collaborator(self, project_id: int, remover_id: int, 
                          collaborator_id: int) -> bool:
        """Remove colaborador do projeto"""
        from src.models.project import ProjectCollaborator
        
        # Verificar permissão
        if not self.check_project_permission(remover_id, project_id, 'manage'):
            raise ValueError("Not authorized to remove collaborators")
        
        collaborator = ProjectCollaborator.query.filter_by(
            project_id=project_id,
            user_id=collaborator_id
        ).first()
        
        if not collaborator:
            return False
        
        self.db.session.delete(collaborator)
        self.db.session.commit()
        
        return True

