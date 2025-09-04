# src/routes/integrations.py

from flask import Blueprint, jsonify, request
from src import db
from src.models.integration import Integration
from src.utils.decorators import token_required

# No futuro, você criará um serviço para lidar com a lógica real
# from src.services.integration_service import IntegrationService
# integration_service = IntegrationService()

integrations_bp = Blueprint('integrations', __name__)


@integrations_bp.route('/', methods=['GET'])
@token_required
def get_integrations(current_user):
    """
    Busca as configurações de integração do usuário, ofuscando as credenciais.
    Corresponde à chamada 'getIntegrations' no front-end.
    """
    integration_config = Integration.query.filter_by(user_id=current_user['id']).first()

    if not integration_config or not integration_config.configs:
        return jsonify({'credentials': {}, 'syncTargets': {}})

    credentials = integration_config.configs.get('credentials', {})
    sync_targets = integration_config.configs.get('syncTargets', {})

    # Ofusca as credenciais para segurança no front-end
    ofuscated_credentials = {}
    for key, value in credentials.items():
        if value and len(value) > 8:
            ofuscated_credentials[key] = f"********{value[-4:]}"
        elif value:
            ofuscated_credentials[key] = "********"
        else:
            ofuscated_credentials[key] = ""

    return jsonify({
        'credentials': ofuscated_credentials,
        'syncTargets': sync_targets
    })


@integrations_bp.route('/config', methods=['POST'])
@token_required
def save_integrations_config(current_user):
    """
    Salva as credenciais e os alvos de sincronização do usuário.
    Corresponde à chamada 'saveIntegrationsConfig' no front-end.
    """
    data = request.get_json()
    new_credentials = data.get('credentials', {})
    new_sync_targets = data.get('syncTargets', {})

    integration_config = Integration.query.filter_by(user_id=current_user['id']).first()
    
    if not integration_config:
        # Se não existe, cria um novo registro
        integration_config = Integration(user_id=current_user['id'], configs={})
        db.session.add(integration_config)

    # Lógica para atualizar credenciais sem apagar as existentes
    current_configs = integration_config.configs or {'credentials': {}, 'syncTargets': {}}
    
    # Atualiza apenas as credenciais que foram enviadas (não apaga as que não foram)
    for key, value in new_credentials.items():
        # Apenas atualiza se o valor não for a versão ofuscada
        if "********" not in value:
            current_configs['credentials'][key] = value

    # Atualiza os alvos de sincronização
    current_configs['syncTargets'].update(new_sync_targets)
    
    # Marca o campo JSON como modificado para garantir que o SQLAlchemy salve
    from sqlalchemy.orm.attributes import flag_modified
    flag_modified(integration_config, "configs")
    
    db.session.commit()
    
    return jsonify({'message': 'Configurações salvas com sucesso!'})


@integrations_bp.route('/test-connections', methods=['GET'])
@token_required
def test_connections_api(current_user):
    """
    Testa a validade das credenciais salvas.
    Corresponde à chamada 'testConnectionsApi'.
    """
    # Placeholder: A lógica real chamaria um serviço para testar cada API.
    # Ex: github_status = integration_service.test_github(current_user)
    
    mock_results = {
        'github': {'status': 'connected', 'repos_count': 15},
        'trello': {'status': 'error', 'error': 'Token inválido ou expirado.'},
        'notion': {'status': 'connected', 'databases_count': 3},
        'capacities': {'status': 'not_configured'},
        'obsidian': {'status': 'available', 'note': 'Funciona com arquivos locais'},
    }
    return jsonify({'connections': mock_results})


@integrations_bp.route('/sync/tasks', methods=['POST'])
@token_required
def sync_tasks_api(current_user):
    """
    Recebe alvos e dispara a sincronização de tarefas.
    Corresponde à chamada 'syncTasksApi'.
    """
    targets = request.get_json()
    
    # Placeholder: A lógica real buscaria as tarefas do usuário e as enviaria
    # para os serviços correspondentes.
    # Ex: results = integration_service.sync_all_tasks(current_user, targets)
    
    mock_results = {
        'synced_tasks': 5,
        'results': {
            'github': [{'id': 123, 'url': '...'}],
            'trello': [],
            'notion': [],
            'errors': ['Falha ao sincronizar 1 tarefa com o Trello.']
        }
    }
    return jsonify(mock_results)


@integrations_bp.route('/obsidian/export', methods=['POST'])
@token_required
def export_to_obsidian_api(current_user):
    """
    Inicia a exportação de notas para o Obsidian.
    Corresponde à chamada 'exportToObsidianApi'.
    """
    vault_path = request.get_json().get('vault_path')
    
    # Placeholder: A lógica real buscaria as notas do usuário e as salvaria
    # no caminho do vault especificado.
    # Ex: count = integration_service.export_to_obsidian(current_user, vault_path)

    return jsonify({'exported_count': 10})