from flask import Blueprint, request, jsonify, current_app
from flask_cors import cross_origin
from src.models.user import User, db
from src.models.project import Project, Task, ProjectCollaborator
from src.services.collaboration import PermissionService, CommentService
import jwt
from datetime import datetime

collaboration_bp = Blueprint('collaboration', __name__)

permission_service = PermissionService(db)
comment_service = CommentService(db)

def get_user_from_token(token):
    """Extrai usuário do token JWT"""
    try:
        payload = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = payload.get('user_id')
        return User.query.get(user_id)
    except:
        return None

@collaboration_bp.route('/projects', methods=['GET'])
@cross_origin()
def get_user_projects():
    """Lista projetos do usuário (próprios e colaborativos)"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    try:
        projects = permission_service.get_user_projects(user.id)
        return jsonify({
            'success': True,
            'projects': projects
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects', methods=['POST'])
@cross_origin()
def create_project():
    """Cria novo projeto"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    is_public = data.get('is_public', False)
    settings = data.get('settings', {})
    
    if not name:
        return jsonify({'error': 'Project name is required'}), 400
    
    try:
        project = Project(
            name=name,
            description=description,
            owner_id=user.id,
            is_public=is_public,
            settings=settings
        )
        
        db.session.add(project)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'project': project.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects/<int:project_id>', methods=['GET'])
@cross_origin()
def get_project(project_id):
    """Obtém detalhes de um projeto"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Verificar permissão de leitura
    if not permission_service.check_project_permission(user.id, project_id, 'read'):
        return jsonify({'error': 'Access denied'}), 403
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    # Buscar tarefas do projeto
    tasks = Task.query.filter_by(project_id=project_id).all()
    
    # Buscar colaboradores
    collaborators = ProjectCollaborator.query.filter_by(
        project_id=project_id,
        status='accepted'
    ).all()
    
    project_data = project.to_dict()
    project_data['tasks'] = [task.to_dict() for task in tasks]
    project_data['collaborators'] = [collab.to_dict() for collab in collaborators]
    
    return jsonify({
        'success': True,
        'project': project_data
    })

@collaboration_bp.route('/projects/<int:project_id>', methods=['PUT'])
@cross_origin()
def update_project(project_id):
    """Atualiza projeto"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Verificar permissão de escrita
    if not permission_service.check_project_permission(user.id, project_id, 'write'):
        return jsonify({'error': 'Access denied'}), 403
    
    project = Project.query.get(project_id)
    if not project:
        return jsonify({'error': 'Project not found'}), 404
    
    data = request.get_json()
    
    try:
        if 'name' in data:
            project.name = data['name']
        if 'description' in data:
            project.description = data['description']
        if 'is_public' in data:
            project.is_public = data['is_public']
        if 'settings' in data:
            project.update_settings(data['settings'])
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'project': project.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects/<int:project_id>/tasks', methods=['POST'])
@cross_origin()
def create_task():
    """Cria nova tarefa no projeto"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    project_id = request.view_args['project_id']
    
    # Verificar permissão de escrita
    if not permission_service.check_project_permission(user.id, project_id, 'write'):
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    title = data.get('title')
    description = data.get('description', '')
    assigned_to = data.get('assigned_to')
    priority = data.get('priority', 'medium')
    category = data.get('category', 'general')
    due_date = data.get('due_date')
    tags = data.get('tags', [])
    
    if not title:
        return jsonify({'error': 'Task title is required'}), 400
    
    try:
        # Converter due_date se fornecido
        due_date_obj = None
        if due_date:
            due_date_obj = datetime.fromisoformat(due_date.replace('Z', '+00:00'))
        
        task = Task(
            title=title,
            description=description,
            project_id=project_id,
            created_by=user.id,
            assigned_to=assigned_to,
            priority=priority,
            category=category,
            due_date=due_date_obj,
            tags=tags
        )
        
        db.session.add(task)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects/<int:project_id>/tasks/<int:task_id>', methods=['PUT'])
@cross_origin()
def update_task(project_id, task_id):
    """Atualiza tarefa"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Verificar permissão de escrita
    if not permission_service.check_project_permission(user.id, project_id, 'write'):
        return jsonify({'error': 'Access denied'}), 403
    
    task = Task.query.get(task_id)
    if not task or task.project_id != project_id:
        return jsonify({'error': 'Task not found'}), 404
    
    data = request.get_json()
    
    try:
        if 'title' in data:
            task.title = data['title']
        if 'description' in data:
            task.description = data['description']
        if 'assigned_to' in data:
            task.assigned_to = data['assigned_to']
        if 'status' in data:
            task.status = data['status']
            if data['status'] == 'completed':
                task.complete()
        if 'priority' in data:
            task.priority = data['priority']
        if 'category' in data:
            task.category = data['category']
        if 'due_date' in data:
            if data['due_date']:
                task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))
            else:
                task.due_date = None
        if 'tags' in data:
            task.tags = json.dumps(data['tags'])
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'task': task.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects/<int:project_id>/invite', methods=['POST'])
@cross_origin()
def invite_collaborator(project_id):
    """Convida colaborador para projeto"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    data = request.get_json()
    email = data.get('email')
    role = data.get('role', 'member')
    
    if not email:
        return jsonify({'error': 'Email is required'}), 400
    
    try:
        invitation = permission_service.invite_collaborator(
            project_id, user.id, email, role
        )
        
        return jsonify({
            'success': True,
            'invitation': invitation
        }), 201
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/invitations/<int:invitation_id>/accept', methods=['POST'])
@cross_origin()
def accept_invitation(invitation_id):
    """Aceita convite de colaboração"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    try:
        invitation = permission_service.accept_invitation(invitation_id, user.id)
        
        return jsonify({
            'success': True,
            'invitation': invitation
        })
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects/<int:project_id>/collaborators', methods=['GET'])
@cross_origin()
def get_collaborators(project_id):
    """Lista colaboradores do projeto"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Verificar permissão de leitura
    if not permission_service.check_project_permission(user.id, project_id, 'read'):
        return jsonify({'error': 'Access denied'}), 403
    
    collaborators = ProjectCollaborator.query.filter_by(project_id=project_id).all()
    
    collaborator_data = []
    for collab in collaborators:
        collab_dict = collab.to_dict()
        # Adicionar dados do usuário
        user_data = User.query.get(collab.user_id)
        if user_data:
            collab_dict['user'] = {
                'id': user_data.id,
                'username': user_data.username,
                'email': user_data.email
            }
        collaborator_data.append(collab_dict)
    
    return jsonify({
        'success': True,
        'collaborators': collaborator_data
    })

@collaboration_bp.route('/projects/<int:project_id>/collaborators/<int:collaborator_id>', methods=['DELETE'])
@cross_origin()
def remove_collaborator(project_id, collaborator_id):
    """Remove colaborador do projeto"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    try:
        success = permission_service.remove_collaborator(
            project_id, user.id, collaborator_id
        )
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Collaborator removed successfully'
            })
        else:
            return jsonify({'error': 'Collaborator not found'}), 404
            
    except ValueError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects/<int:project_id>/tasks/<int:task_id>/comments', methods=['GET'])
@cross_origin()
def get_task_comments(project_id, task_id):
    """Lista comentários de uma tarefa"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Verificar permissão de leitura
    if not permission_service.check_project_permission(user.id, project_id, 'read'):
        return jsonify({'error': 'Access denied'}), 403
    
    try:
        comments = comment_service.get_comments(task_id)
        return jsonify({
            'success': True,
            'comments': comments
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@collaboration_bp.route('/projects/<int:project_id>/tasks/<int:task_id>/comments', methods=['POST'])
@cross_origin()
def add_task_comment(project_id, task_id):
    """Adiciona comentário a uma tarefa"""
    auth_header = request.headers.get('Authorization')
    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Authentication required'}), 401
    
    token = auth_header.split(' ')[1]
    user = get_user_from_token(token)
    if not user:
        return jsonify({'error': 'Invalid token'}), 401
    
    # Verificar permissão de escrita
    if not permission_service.check_project_permission(user.id, project_id, 'write'):
        return jsonify({'error': 'Access denied'}), 403
    
    data = request.get_json()
    content = data.get('content')
    parent_comment_id = data.get('parent_comment_id')
    
    if not content:
        return jsonify({'error': 'Comment content is required'}), 400
    
    try:
        comment = comment_service.add_comment(
            project_id, task_id, user.id, content, parent_comment_id
        )
        
        return jsonify({
            'success': True,
            'comment': comment
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

