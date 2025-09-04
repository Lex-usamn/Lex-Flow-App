# src/routes/study_videos.py

from flask import Blueprint, jsonify, request
from src import db
from src.models.study_video import StudyVideo
from src.utils.decorators import token_required

study_videos_bp = Blueprint('study_videos', __name__)

# Rota para buscar todos os vídeos de estudo do usuário
@study_videos_bp.route('/', methods=['GET'])
@token_required
def get_videos(current_user):
    videos = StudyVideo.query.filter_by(user_id=current_user['id']).order_by(StudyVideo.created_at.desc()).all()
    return jsonify({'videos': [video.to_dict() for video in videos]})

# Rota para adicionar um novo vídeo de estudo
@study_videos_bp.route('/', methods=['POST'])
@token_required
def add_video(current_user):
    data = request.get_json()
    if not data or not data.get('video_url'):
        return jsonify({'error': 'URL do vídeo é obrigatória'}), 400

    new_video = StudyVideo(
        user_id=current_user['id'],
        video_url=data.get('video_url'),
        title=data.get('title'),
        notes=data.get('notes'),
        status=data.get('status', 'To Watch')
    )
    db.session.add(new_video)
    db.session.commit()
    return jsonify({'video': new_video.to_dict()}), 201

# Rota para atualizar um vídeo de estudo
@study_videos_bp.route('/<int:video_id>', methods=['PUT'])
@token_required
def update_video(current_user, video_id):
    video = StudyVideo.query.filter_by(id=video_id, user_id=current_user['id']).first_or_404()
    data = request.get_json()

    # Atualiza apenas os campos fornecidos
    video.title = data.get('title', video.title)
    video.notes = data.get('notes', video.notes)
    video.status = data.get('status', video.status)
    video.video_url = data.get('video_url', video.video_url)
    
    db.session.commit()
    return jsonify({'video': video.to_dict()})

# Rota para deletar um vídeo de estudo
@study_videos_bp.route('/<int:video_id>', methods=['DELETE'])
@token_required
def delete_video(current_user, video_id):
    video = StudyVideo.query.filter_by(id=video_id, user_id=current_user['id']).first_or_404()
    db.session.delete(video)
    db.session.commit()
    return jsonify({'message': 'Vídeo deletado com sucesso'}), 200