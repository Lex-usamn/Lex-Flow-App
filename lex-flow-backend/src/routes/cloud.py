# src/routes/cloud.py (VERSÃO ATUALIZADA)

from flask import Blueprint, request, jsonify, current_app
from datetime import datetime, timedelta

# O QUE MUDOU: Importamos o decorador que centraliza a lógica de autenticação.
from src.routes.auth import token_required

from src.models.user import User, db
from src.models.cloud_sync import CloudSync # Verifique se este import está correto
from src.services.cloud_storage import CloudSyncManager, GoogleDriveService, DropboxService, OneDriveService
import os

cloud_bp = Blueprint('cloud', __name__)

# ... (toda a sua configuração de OAUTH_CONFIGS e sync_manager permanece igual) ...
OAUTH_CONFIGS = {
    'google_drive': {
        'client_id': os.environ.get('GOOGLE_CLIENT_ID', 'your_google_client_id'),
        'client_secret': os.environ.get('GOOGLE_CLIENT_SECRET', 'your_google_client_secret'),
        'redirect_uri': os.environ.get('GOOGLE_REDIRECT_URI', 'http://localhost:5000/api/cloud/google/callback')
    },
    'dropbox': {
        'client_id': os.environ.get('DROPBOX_CLIENT_ID', 'your_dropbox_client_id'),
        'client_secret': os.environ.get('DROPBOX_CLIENT_SECRET', 'your_dropbox_client_secret'),
        'redirect_uri': os.environ.get('DROPBOX_REDIRECT_URI', 'http://localhost:5000/api/cloud/dropbox/callback')
    },
    'onedrive': {
        'client_id': os.environ.get('ONEDRIVE_CLIENT_ID', 'your_onedrive_client_id'),
        'client_secret': os.environ.get('ONEDRIVE_CLIENT_SECRET', 'your_onedrive_client_secret'),
        'redirect_uri': os.environ.get('ONEDRIVE_REDIRECT_URI', 'http://localhost:5000/api/cloud/onedrive/callback')
    }
}
sync_manager = CloudSyncManager()

# O QUE MUDOU: Esta função auxiliar não é mais necessária, pois o decorador @token_required faz o trabalho dela.
# REMOVIDO: def get_user_from_token(token): ...

# As rotas a seguir são PÚBLICAS, pois iniciam o fluxo OAuth e não dependem de um usuário logado no nosso sistema ainda.
@cloud_bp.route('/providers', methods=['GET'])
def get_cloud_providers():
    # ... (código inalterado) ...
    providers = [
        {'id': 'google_drive', 'name': 'Google Drive', 'description': 'Sincronize com Google Drive', 'icon': 'https://developers.google.com/drive/images/drive_icon.png', 'features': ['backup', 'sync', 'sharing']},
        {'id': 'dropbox', 'name': 'Dropbox', 'description': 'Sincronize com Dropbox', 'icon': 'https://cfl.dropboxstatic.com/static/images/logo_catalog/dropbox_logo_glyph_blue_m1.svg', 'features': ['backup', 'sync', 'sharing']},
        {'id': 'onedrive', 'name': 'Microsoft OneDrive', 'description': 'Sincronize com OneDrive', 'icon': 'https://img.icons8.com/color/48/000000/microsoft-onedrive-2019.png', 'features': ['backup', 'sync', 'office_integration']}
    ]
    return jsonify({'success': True, 'providers': providers})

@cloud_bp.route('/connect/<provider>', methods=['POST'])
def connect_provider(provider):
    # ... (código inalterado) ...
    if provider not in OAUTH_CONFIGS: return jsonify({'error': 'Provider not supported'}), 400
    config = OAUTH_CONFIGS[provider]
    if provider == 'google_drive':
        service = GoogleDriveService()
        auth_url = service.get_auth_url(config['client_id'], config['redirect_uri'])
    elif provider == 'dropbox':
        service = DropboxService()
        auth_url = service.get_auth_url(config['client_id'], config['redirect_uri'])
    elif provider == 'onedrive':
        service = OneDriveService()
        auth_url = service.get_auth_url(config['client_id'], config['redirect_uri'])
    else: return jsonify({'error': 'Provider not implemented'}), 400
    return jsonify({'success': True, 'auth_url': auth_url, 'provider': provider})


@cloud_bp.route('/<provider>/callback', methods=['GET', 'POST'])
def oauth_callback(provider):
    # ... (código inalterado, pois esta rota é chamada pelo provedor externo) ...
    code = request.args.get('code')
    error = request.args.get('error')
    if error: return jsonify({'error': f'OAuth error: {error}'}), 400
    if not code: return jsonify({'error': 'Authorization code not provided'}), 400
    if provider not in OAUTH_CONFIGS: return jsonify({'error': 'Provider not supported'}), 400
    config = OAUTH_CONFIGS[provider]
    try:
        if provider == 'google_drive':
            service = GoogleDriveService()
            tokens = service.exchange_code_for_tokens(code, config['client_id'], config['client_secret'], config['redirect_uri'])
        elif provider == 'dropbox':
            service = DropboxService()
            tokens = service.exchange_code_for_tokens(code, config['client_id'], config['client_secret'], config['redirect_uri'])
        elif provider == 'onedrive':
            service = OneDriveService()
            tokens = service.exchange_code_for_tokens(code, config['client_id'], config['client_secret'], config['redirect_uri'])
        else: return jsonify({'error': 'Provider not implemented'}), 400
        if 'error' in tokens: return jsonify({'error': tokens['error']}), 400
        return jsonify({'success': True, 'provider': provider, 'tokens': tokens, 'message': 'Authorization successful. Please save these tokens.'})
    except Exception as e: return jsonify({'error': str(e)}), 500


# --- AS ROTAS A SEGUIR AGORA SÃO PROTEGIDAS ---

@cloud_bp.route('/save-connection', methods=['POST'])
@token_required  # O QUE MUDOU
def save_connection(current_user): # O QUE MUDOU
    """Salva conexão com provedor de nuvem para o usuário atual."""
    data = request.get_json()
    # REMOVIDO: Bloco inteiro de verificação de token manual
    
    provider = data.get('provider')
    tokens = data.get('tokens')
    
    if not provider or not tokens:
        return jsonify({'error': 'Provider and tokens required'}), 400
    
    try:
        existing_sync = CloudSync.query.filter_by(
            user_id=current_user.id, # O QUE MUDOU: usa current_user
            provider=provider
        ).first()
        
        # ... (resto da lógica permanece a mesma, usando current_user.id) ...
        if existing_sync:
            existing_sync.access_token = sync_manager.get_provider(provider).encrypt_token(tokens['access_token'])
            if 'refresh_token' in tokens:
                existing_sync.refresh_token = sync_manager.get_provider(provider).encrypt_token(tokens['refresh_token'])
            if 'expires_in' in tokens:
                existing_sync.token_expires_at = datetime.utcnow() + timedelta(seconds=tokens['expires_in'])
            existing_sync.sync_enabled = True
            existing_sync.updated_at = datetime.utcnow()
        else:
            cloud_sync = CloudSync(
                user_id=current_user.id,
                provider=provider,
                access_token=sync_manager.get_provider(provider).encrypt_token(tokens['access_token']),
                refresh_token=sync_manager.get_provider(provider).encrypt_token(tokens.get('refresh_token', '')),
                provider_user_id=tokens.get('user_id', ''),
                sync_settings={'auto_sync': True, 'backup_frequency': 'daily'}
            )
            if 'expires_in' in tokens:
                cloud_sync.token_expires_at = datetime.utcnow() + timedelta(seconds=tokens['expires_in'])
            db.session.add(cloud_sync)
        
        db.session.commit()
        return jsonify({'success': True, 'message': f'Successfully connected to {provider}', 'provider': provider})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@cloud_bp.route('/connections', methods=['GET'])
@token_required # O QUE MUDOU
def get_connections(current_user): # O QUE MUDOU
    """Lista conexões de nuvem do usuário atual."""
    # REMOVIDO: Bloco de verificação de token
    connections = CloudSync.query.filter_by(user_id=current_user.id).all() # O QUE MUDOU
    return jsonify({'success': True, 'connections': [conn.to_dict() for conn in connections]})


@cloud_bp.route('/sync/<provider>', methods=['POST'])
@token_required # O QUE MUDOU
def sync_with_provider(current_user, provider): # O QUE MUDOU
    """Sincroniza dados com provedor específico para o usuário atual."""
    # REMOVIDO: Bloco de verificação de token
    cloud_sync = CloudSync.query.filter_by(
        user_id=current_user.id, # O QUE MUDOU
        provider=provider
    ).first()
    
    if not cloud_sync:
        return jsonify({'error': 'Provider not connected'}), 400
    
    # ... (resto da lógica permanece a mesma, usando current_user.id) ...
    try:
        service = sync_manager.get_provider(provider)
        access_token = service.decrypt_token(cloud_sync.access_token)
        if cloud_sync.token_expires_at and cloud_sync.token_expires_at < datetime.utcnow():
            if cloud_sync.refresh_token:
                config = OAUTH_CONFIGS[provider]
                refresh_token = service.decrypt_token(cloud_sync.refresh_token)
                new_tokens = service.refresh_access_token(refresh_token, config['client_id'], config['client_secret'])
                if 'access_token' in new_tokens:
                    cloud_sync.access_token = service.encrypt_token(new_tokens['access_token'])
                    if 'expires_in' in new_tokens:
                        cloud_sync.token_expires_at = datetime.utcnow() + timedelta(seconds=new_tokens['expires_in'])
                    access_token = new_tokens['access_token']
                    db.session.commit()
                else: return jsonify({'error': 'Failed to refresh token'}), 401
            else: return jsonify({'error': 'Token expired and no refresh token available'}), 401
        
        cloud_sync.sync_status = 'syncing'
        db.session.commit()
        
        sync_result = sync_manager.sync_user_data(current_user.id, provider, access_token) # O QUE MUDOU
        
        if sync_result.get('success'):
            cloud_sync.update_sync_status('completed')
        else:
            cloud_sync.sync_status = 'error'
        
        db.session.commit()
        return jsonify(sync_result)
    except Exception as e:
        cloud_sync.sync_status = 'error'
        db.session.commit()
        return jsonify({'error': str(e)}), 500


@cloud_bp.route('/disconnect/<provider>', methods=['DELETE'])
@token_required # O QUE MUDOU
def disconnect_provider(current_user, provider): # O QUE MUDOU
    """Desconecta provedor de nuvem para o usuário atual."""
    # REMOVIDO: Bloco de verificação de token
    cloud_sync = CloudSync.query.filter_by(
        user_id=current_user.id, # O QUE MUDOU
        provider=provider
    ).first()
    
    if not cloud_sync:
        return jsonify({'error': 'Provider not connected'}), 400
    
    try:
        db.session.delete(cloud_sync)
        db.session.commit()
        return jsonify({'success': True, 'message': f'Successfully disconnected from {provider}'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@cloud_bp.route('/sync-status', methods=['GET'])
@token_required # O QUE MUDOU
def get_sync_status(current_user): # O QUE MUDOU
    """Obtém status de sincronização do usuário atual."""
    # REMOVIDO: Bloco de verificação de token
    connections = CloudSync.query.filter_by(user_id=current_user.id).all() # O QUE MUDOU
    status_summary = {
        'total_providers': len(connections),
        'active_syncs': len([c for c in connections if c.sync_enabled]),
        'last_sync': None,
        'providers': {}
    }
    for conn in connections:
        status_summary['providers'][conn.provider] = {
            'connected': True,
            'sync_enabled': conn.sync_enabled,
            'last_sync': conn.last_sync.isoformat() if conn.last_sync else None,
            'sync_status': conn.sync_status,
            'provider_user_id': conn.provider_user_id
        }
        if conn.last_sync:
            if not status_summary['last_sync'] or conn.last_sync > datetime.fromisoformat(status_summary['last_sync']):
                status_summary['last_sync'] = conn.last_sync.isoformat()
    return jsonify({'success': True, 'sync_status': status_summary})