# lex-flow-backend/src/routes/collaboration.py

from flask import Blueprint, request, jsonify
from src import db
import json
from src.models.user import User
from src.models.project import Project, Task, ProjectCollaborator
from src.models.comment import Comment
from src.routes.auth import token_required
from datetime import datetime

collaboration_bp = Blueprint('collaboration', __name__)

@collaboration_bp.route('/projects', methods=['GET'])
@token_required
def get_projects(current_user): # 'current_user' agora é um objeto User
    """ Busca todos os projetos associados ao usuário logado. """
    try:
        # Não precisamos mais buscar o usuário, já o temos!
        # A linha abaixo já é o objeto User completo.
        user = current_user 
        
        if not user:
            return jsonify({'error': 'Usuário não encontrado'}), 404

        user_projects = user.projects 
        
        return jsonify({'projects': [project.to_dict() for project in user_projects]})

    except Exception as e:
        print(f"ERRO AO BUSCAR PROJETOS: {e}")
        return jsonify({'error': 'Erro interno do servidor ao buscar projetos'}), 500


@collaboration_bp.route('/projects', methods=['POST'])
@token_required
def create_project(current_user): # 'current_user' agora é um objeto User
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Nome do projeto é obrigatório'}), 400

    try:
        new_project = Project(
            name=data.get('name'),
            # CORREÇÃO: Usamos a sintaxe de objeto '.'
            owner_id=current_user.id,
            tenant_id=current_user.tenant_id,
            description=data.get('description'),
            is_public=data.get('is_public', False)
        )
        
        # 'current_user' já é o objeto que precisamos
        new_project.users.append(current_user)
        
        db.session.add(new_project)
        db.session.commit()
        
        return jsonify({'project': new_project.to_dict()}), 201
        
    except Exception as e:
        db.session.rollback()
        print(f"Erro ao criar projeto: {e}")
        return jsonify({'error': f"Erro interno: {e}"}), 500


@collaboration_bp.route('/projects/<int:project_id>', methods=['GET'])
@token_required
def get_project(current_user, project_id):
    """Obtém detalhes de um projeto, se ele pertencer ao tenant do usuário."""
    # A linha de segurança crucial está aqui.
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404
    
    project_data = project.to_dict()
    project_data['tasks'] = [task.to_dict() for task in project.tasks]
    project_data['collaborators'] = [collab.to_dict() for collab in project.collaborators]
    
    return jsonify({
        'success': True,
        'project': project_data
    })


@collaboration_bp.route('/projects/<int:project_id>', methods=['PUT'])
@token_required
def update_project(current_user, project_id):
    """Atualiza um projeto, se ele pertencer ao tenant do usuário."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404
    
    if project.owner_id != current_user.id:
        return jsonify({'success': False, 'error': 'Acesso negado'}), 403

    data = request.get_json()
    try:
        if 'name' in data: project.name = data['name']
        if 'description' in data: project.description = data['description']
        if 'is_public' in data: project.is_public = data['is_public']
        if 'settings' in data: project.settings = json.dumps(data['settings'])
        
        project.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({'success': True, 'project': project.to_dict()})
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@collaboration_bp.route('/projects/<int:project_id>/tasks', methods=['POST'])
@token_required
def create_task_in_project(current_user, project_id):
    """Cria nova tarefa no projeto, se ele pertencer ao tenant."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404

    data = request.get_json()
    if not data or not data.get('title'):
        return jsonify({'success': False, 'error': 'O título da tarefa é obrigatório'}), 400
    
    try:
        due_date_obj = None
        if data.get('due_date'):
            due_date_obj = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00'))

        task = Task(
            title=data.get('title'),
            description=data.get('description', ''),
            project_id=project_id,
            created_by=current_user.id,
            assigned_to=data.get('assigned_to'),
            priority=data.get('priority', 'medium'),
            category=data.get('category', 'general'),
            due_date=due_date_obj,
            tags=json.dumps(data.get('tags', []))
            
        )
        db.session.add(task)
        db.session.commit()
        return jsonify({'success': True, 'task': task.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@collaboration_bp.route('/projects/<int:project_id>/tasks/<int:task_id>', methods=['PUT'])
@token_required
def update_task(current_user, project_id, task_id):
    """Atualiza uma tarefa, garantindo que ela pertence ao tenant."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404

    task = Task.query.filter_by(id=task_id, project_id=project.id).first()
    if not task:
        return jsonify({'success': False, 'error': 'Tarefa não encontrada'}), 404
        
    data = request.get_json()
    try:
        if 'title' in data: task.title = data['title']
        if 'description' in data: task.description = data['description']
        if 'assigned_to' in data: task.assigned_to = data['assigned_to']
        if 'status' in data:
            task.status = data['status']
            if data['status'] == 'completed': task.completed_at = datetime.utcnow()
        if 'priority' in data: task.priority = data['priority']
        if 'category' in data: task.category = data['category']
        if 'due_date' in data:
            task.due_date = datetime.fromisoformat(data['due_date'].replace('Z', '+00:00')) if data['due_date'] else None
        if 'tags' in data: task.tags = json.dumps(data['tags'])
        
        task.updated_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True, 'task': task.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@collaboration_bp.route('/projects/<int:project_id>/invite', methods=['POST'])
@token_required
def invite_collaborator(current_user, project_id):
    """Convida um colaborador para um projeto (ele deve pertencer ao mesmo tenant)."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404

    if project.owner_id != current_user.id:
        return jsonify({'success': False, 'error': 'Apenas o dono do projeto pode convidar'}), 403

    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'success': False, 'error': 'Email é obrigatório'}), 400

    user_to_invite = User.query.filter_by(email=email, tenant_id=current_user.tenant_id).first()
    if not user_to_invite:
        return jsonify({'success': False, 'error': 'Usuário não encontrado nesta organização.'}), 404

    if user_to_invite.id == current_user.id:
        return jsonify({'success': False, 'error': 'Você não pode convidar a si mesmo.'}), 400
        
    existing_collaborator = ProjectCollaborator.query.filter_by(project_id=project_id, user_id=user_to_invite.id).first()
    if existing_collaborator:
        return jsonify({'success': False, 'error': 'Este usuário já é um colaborador.'}), 409

    try:
        invitation = ProjectCollaborator(
            project_id=project_id,
            user_id=user_to_invite.id,
            role=data.get('role', 'member'),
            invited_by=current_user.id,
            status='pending'
        )
        db.session.add(invitation)
        db.session.commit()
        return jsonify({'success': True, 'invitation': invitation.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@collaboration_bp.route('/invitations/<int:invitation_id>/accept', methods=['POST'])
@token_required
def accept_invitation(current_user, invitation_id):
    """Aceita um convite de colaboração."""
    invitation = ProjectCollaborator.query.filter_by(id=invitation_id, user_id=current_user.id, status='pending').first()
    
    if not invitation:
        return jsonify({'success': False, 'error': 'Convite não encontrado ou inválido'}), 404

    try:
        invitation.status = 'accepted'
        invitation.accepted_at = datetime.utcnow()
        db.session.commit()
        return jsonify({'success': True, 'invitation': invitation.to_dict()})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@collaboration_bp.route('/projects/<int:project_id>/collaborators', methods=['GET'])
@token_required
def get_collaborators(current_user, project_id):
    """Lista colaboradores de um projeto do tenant."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404

    collaborators = ProjectCollaborator.query.filter_by(project_id=project_id).all()
    
    collaborator_data = []
    for collab in collaborators:
        collab_dict = collab.to_dict()
        user_data = User.query.get(collab.user_id)
        if user_data:
            collab_dict['user'] = { 'username': user_data.username, 'email': user_data.email }
        collaborator_data.append(collab_dict)

    return jsonify({'success': True, 'collaborators': collaborator_data})


@collaboration_bp.route('/projects/<int:project_id>/collaborators/<int:collaborator_id>', methods=['DELETE'])
@token_required
def remove_collaborator(current_user, project_id, collaborator_id):
    """Remove um colaborador de um projeto do tenant."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404

    if project.owner_id != current_user.id:
        return jsonify({'success': False, 'error': 'Apenas o dono do projeto pode remover colaboradores'}), 403

    collaborator = ProjectCollaborator.query.filter_by(id=collaborator_id, project_id=project_id).first()
    if not collaborator:
        return jsonify({'success': False, 'error': 'Colaborador não encontrado'}), 404
        
    if collaborator.user_id == project.owner_id:
        return jsonify({'success': False, 'error': 'O dono do projeto não pode ser removido.'}), 400

    try:
        db.session.delete(collaborator)
        db.session.commit()
        return jsonify({'success': True, 'message': 'Colaborador removido com sucesso'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500


@collaboration_bp.route('/projects/<int:project_id>/tasks/<int:task_id>/comments', methods=['GET'])
@token_required
def get_task_comments(current_user, project_id, task_id):
    """Lista comentários de uma tarefa, verificando o tenant."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404

    task = Task.query.filter_by(id=task_id, project_id=project.id).first()
    if not task:
        return jsonify({'success': False, 'error': 'Tarefa não encontrada'}), 404

    try:
        comments = Comment.query.filter_by(task_id=task_id).all()
        return jsonify({
            'success': True,
            'comments': [c.to_dict() for c in comments]
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@collaboration_bp.route('/projects/<int:project_id>/tasks/<int:task_id>/comments', methods=['POST'])
@token_required
def add_task_comment(current_user, project_id, task_id):
    """Adiciona um comentário a uma tarefa, verificando o tenant."""
    project = Project.query.filter_by(id=project_id, tenant_id=current_user.tenant_id).first()
    if not project:
        return jsonify({'success': False, 'error': 'Projeto não encontrado'}), 404

    task = Task.query.filter_by(id=task_id, project_id=project.id).first()
    if not task:
        return jsonify({'success': False, 'error': 'Tarefa não encontrada'}), 404

    data = request.get_json()
    content = data.get('content')
    if not content:
        return jsonify({'success': False, 'error': 'O conteúdo do comentário é obrigatório'}), 400
    
    try:
        comment = Comment(
            content=content,
            project_id=project_id, # Adicionado para consistência
            task_id=task_id,
            user_id=current_user.id,
            parent_comment_id=data.get('parent_comment_id')
        )
        db.session.add(comment)
        db.session.commit()
        return jsonify({
            'success': True,
            'comment': comment.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500