# src/routes/quick_notes.py

from flask import Blueprint, jsonify, request
from src import db
from src.models.quick_note import QuickNote
# IMPORTANTE: Precisaremos do modelo Task para a conversão
from src.models.project import Task 
from src.utils.decorators import token_required

quick_notes_bp = Blueprint('quick_notes', __name__)

# Rota para buscar todas as anotações do usuário
@quick_notes_bp.route('/', methods=['GET'])
@token_required
def get_notes(current_user):
    notes = QuickNote.query.filter_by(user_id=current_user['id']).order_by(QuickNote.created_at.desc()).all()
    return jsonify({'notes': [note.to_dict() for note in notes]})

# Rota para adicionar uma nova anotação
@quick_notes_bp.route('/', methods=['POST'])
@token_required
def add_note(current_user):
    data = request.get_json()
    new_note = QuickNote(
        user_id=current_user['id'],
        content=data.get('content'),
        category=data.get('category', 'general'),
        tags=data.get('tags', [])
    )
    db.session.add(new_note)
    db.session.commit()
    return jsonify({'note': new_note.to_dict()}), 201

# Rota para deletar uma anotação
@quick_notes_bp.route('/<int:note_id>', methods=['DELETE'])
@token_required
def delete_note(current_user, note_id):
    note = QuickNote.query.filter_by(id=note_id, user_id=current_user['id']).first_or_404()
    db.session.delete(note)
    db.session.commit()
    return jsonify({'message': 'Anotação deletada'}), 200

# Rota para converter uma anotação em tarefa
@quick_notes_bp.route('/<int:note_id>/convert-to-task', methods=['POST'])
@token_required
def convert_to_task(current_user, note_id):
    note = QuickNote.query.filter_by(id=note_id, user_id=current_user['id']).first_or_404()
    
    # Lógica para encontrar o projeto "padrão" ou "Caixa de Entrada" do usuário.
    # Por agora, vamos assumir que existe um projeto com um nome específico.
    # TODO: Implementar uma lógica melhor, talvez buscando o primeiro projeto do usuário.
    default_project = Project.query.filter_by(user_id=current_user['id'], name='Inbox').first()
    if not default_project:
        # Se não encontrar, busca o primeiro projeto qualquer do usuário
        default_project = Project.query.filter_by(user_id=current_user['id']).first()
        if not default_project:
            return jsonify({'error': 'Nenhum projeto encontrado para adicionar a tarefa.'}), 404

    # Cria a nova tarefa
    new_task = Task(
        title=note.content,
        project_id=default_project.id,
        category='general' # Categoria padrão para tarefas criadas a partir de notas
    )
    db.session.add(new_task)
    
    # Deleta a anotação original
    db.session.delete(note)
    
    db.session.commit()
    
    return jsonify({'message': 'Nota convertida em tarefa com sucesso'}), 200