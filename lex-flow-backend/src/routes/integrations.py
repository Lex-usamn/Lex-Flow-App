"""
Rotas para Integrações com Ferramentas Externas
"""

from flask import Blueprint, request, jsonify
from src.services.integrations import IntegrationsService
import json

integrations_bp = Blueprint('integrations', __name__)
integrations_service = IntegrationsService()

@integrations_bp.route('/status', methods=['GET'])
def get_integrations_status():
    """Retorna o status das integrações disponíveis"""
    try:
        available = integrations_service.get_available_integrations()
        stats = integrations_service.get_integration_stats()
        
        return jsonify({
            'success': True,
            'integrations': available,
            'stats': stats
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== GITHUB ROUTES ====================

@integrations_bp.route('/github/repos', methods=['GET'])
def get_github_repos():
    """Obtém repositórios do GitHub"""
    try:
        username = request.args.get('username')
        repos = integrations_service.github_get_user_repos(username)
        
        return jsonify({
            'success': True,
            'repos': repos,
            'count': len(repos)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'repos': []
        }), 500

@integrations_bp.route('/github/repos/<repo_full_name>/issues', methods=['GET'])
def get_github_issues(repo_full_name):
    """Obtém issues de um repositório GitHub"""
    try:
        state = request.args.get('state', 'open')
        issues = integrations_service.github_get_repo_issues(repo_full_name, state)
        
        return jsonify({
            'success': True,
            'issues': issues,
            'count': len(issues)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'issues': []
        }), 500

@integrations_bp.route('/github/repos/<repo_full_name>/issues', methods=['POST'])
def create_github_issue(repo_full_name):
    """Cria uma issue no GitHub"""
    try:
        data = request.get_json()
        
        title = data.get('title')
        body = data.get('body', '')
        labels = data.get('labels', [])
        
        if not title:
            return jsonify({
                'success': False,
                'error': 'Título é obrigatório'
            }), 400
        
        issue = integrations_service.github_create_issue(repo_full_name, title, body, labels)
        
        return jsonify({
            'success': True,
            'issue': issue
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@integrations_bp.route('/github/sync-task', methods=['POST'])
def sync_task_to_github():
    """Sincroniza uma tarefa como issue do GitHub"""
    try:
        data = request.get_json()
        
        task = data.get('task')
        repo_full_name = data.get('repo_full_name')
        
        if not task or not repo_full_name:
            return jsonify({
                'success': False,
                'error': 'Tarefa e repositório são obrigatórios'
            }), 400
        
        issue = integrations_service.sync_task_to_github_issue(task, repo_full_name)
        
        return jsonify({
            'success': True,
            'issue': issue
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== TRELLO ROUTES ====================

@integrations_bp.route('/trello/boards', methods=['GET'])
def get_trello_boards():
    """Obtém boards do Trello"""
    try:
        boards = integrations_service.trello_get_user_boards()
        
        return jsonify({
            'success': True,
            'boards': boards,
            'count': len(boards)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'boards': []
        }), 500

@integrations_bp.route('/trello/boards/<board_id>/cards', methods=['GET'])
def get_trello_cards(board_id):
    """Obtém cards de um board Trello"""
    try:
        cards = integrations_service.trello_get_board_cards(board_id)
        
        return jsonify({
            'success': True,
            'cards': cards,
            'count': len(cards)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'cards': []
        }), 500

@integrations_bp.route('/trello/cards', methods=['POST'])
def create_trello_card():
    """Cria um card no Trello"""
    try:
        data = request.get_json()
        
        list_id = data.get('list_id')
        name = data.get('name')
        desc = data.get('desc', '')
        due_date = data.get('due_date')
        
        if not list_id or not name:
            return jsonify({
                'success': False,
                'error': 'ID da lista e nome são obrigatórios'
            }), 400
        
        card = integrations_service.trello_create_card(list_id, name, desc, due_date)
        
        return jsonify({
            'success': True,
            'card': card
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@integrations_bp.route('/trello/sync-task', methods=['POST'])
def sync_task_to_trello():
    """Sincroniza uma tarefa como card do Trello"""
    try:
        data = request.get_json()
        
        task = data.get('task')
        list_id = data.get('list_id')
        
        if not task or not list_id:
            return jsonify({
                'success': False,
                'error': 'Tarefa e ID da lista são obrigatórios'
            }), 400
        
        card = integrations_service.sync_task_to_trello_card(task, list_id)
        
        return jsonify({
            'success': True,
            'card': card
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== NOTION ROUTES ====================

@integrations_bp.route('/notion/databases', methods=['GET'])
def get_notion_databases():
    """Obtém databases do Notion"""
    try:
        databases = integrations_service.notion_get_databases()
        
        return jsonify({
            'success': True,
            'databases': databases,
            'count': len(databases)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'databases': []
        }), 500

@integrations_bp.route('/notion/databases/<database_id>/pages', methods=['GET'])
def get_notion_pages(database_id):
    """Obtém páginas de um database Notion"""
    try:
        pages = integrations_service.notion_get_database_pages(database_id)
        
        return jsonify({
            'success': True,
            'pages': pages,
            'count': len(pages)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'pages': []
        }), 500

@integrations_bp.route('/notion/pages', methods=['POST'])
def create_notion_page():
    """Cria uma página no Notion"""
    try:
        data = request.get_json()
        
        database_id = data.get('database_id')
        properties = data.get('properties')
        
        if not database_id or not properties:
            return jsonify({
                'success': False,
                'error': 'ID do database e propriedades são obrigatórios'
            }), 400
        
        page = integrations_service.notion_create_page(database_id, properties)
        
        return jsonify({
            'success': True,
            'page': page
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@integrations_bp.route('/notion/sync-task', methods=['POST'])
def sync_task_to_notion():
    """Sincroniza uma tarefa como página do Notion"""
    try:
        data = request.get_json()
        
        task = data.get('task')
        database_id = data.get('database_id')
        
        if not task or not database_id:
            return jsonify({
                'success': False,
                'error': 'Tarefa e ID do database são obrigatórios'
            }), 400
        
        page = integrations_service.sync_task_to_notion_page(task, database_id)
        
        return jsonify({
            'success': True,
            'page': page
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== CAPACITIES ROUTES ====================

@integrations_bp.route('/capacities/objects', methods=['GET'])
def get_capacities_objects():
    """Obtém objetos do Capacities"""
    try:
        structure_id = request.args.get('structure_id')
        objects = integrations_service.capacities_get_objects(structure_id)
        
        return jsonify({
            'success': True,
            'objects': objects,
            'count': len(objects)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'objects': []
        }), 500

@integrations_bp.route('/capacities/objects', methods=['POST'])
def create_capacities_object():
    """Cria um objeto no Capacities"""
    try:
        data = request.get_json()
        
        structure_id = data.get('structure_id')
        title = data.get('title')
        properties = data.get('properties', {})
        
        if not structure_id or not title:
            return jsonify({
                'success': False,
                'error': 'ID da estrutura e título são obrigatórios'
            }), 400
        
        obj = integrations_service.capacities_create_object(structure_id, title, properties)
        
        return jsonify({
            'success': True,
            'object': obj
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

# ==================== OBSIDIAN ROUTES ====================

@integrations_bp.route('/obsidian/export', methods=['POST'])
def export_to_obsidian():
    """Exporta notas para um vault do Obsidian"""
    try:
        data = request.get_json()
        
        vault_path = data.get('vault_path')
        notes = data.get('notes', [])
        
        if not vault_path or not notes:
            return jsonify({
                'success': False,
                'error': 'Caminho do vault e notas são obrigatórios'
            }), 400
        
        success = integrations_service.obsidian_export_to_vault(vault_path, notes)
        
        return jsonify({
            'success': success,
            'exported_count': len(notes) if success else 0
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@integrations_bp.route('/obsidian/import', methods=['POST'])
def import_from_obsidian():
    """Importa notas de um vault do Obsidian"""
    try:
        data = request.get_json()
        
        vault_path = data.get('vault_path')
        
        if not vault_path:
            return jsonify({
                'success': False,
                'error': 'Caminho do vault é obrigatório'
            }), 400
        
        notes = integrations_service.obsidian_import_from_vault(vault_path)
        
        return jsonify({
            'success': True,
            'notes': notes,
            'imported_count': len(notes)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e),
            'notes': []
        }), 500

# ==================== BULK SYNC ROUTES ====================

@integrations_bp.route('/sync/tasks', methods=['POST'])
def bulk_sync_tasks():
    """Sincroniza múltiplas tarefas para diferentes plataformas"""
    try:
        data = request.get_json()
        
        tasks = data.get('tasks', [])
        targets = data.get('targets', {})  # {'github': 'repo_name', 'trello': 'list_id', 'notion': 'database_id'}
        
        if not tasks or not targets:
            return jsonify({
                'success': False,
                'error': 'Tarefas e destinos são obrigatórios'
            }), 400
        
        results = {
            'github': [],
            'trello': [],
            'notion': [],
            'errors': []
        }
        
        for task in tasks:
            # Sincronizar com GitHub
            if 'github' in targets:
                try:
                    issue = integrations_service.sync_task_to_github_issue(task, targets['github'])
                    if issue:
                        results['github'].append(issue)
                except Exception as e:
                    results['errors'].append(f"GitHub: {str(e)}")
            
            # Sincronizar com Trello
            if 'trello' in targets:
                try:
                    card = integrations_service.sync_task_to_trello_card(task, targets['trello'])
                    if card:
                        results['trello'].append(card)
                except Exception as e:
                    results['errors'].append(f"Trello: {str(e)}")
            
            # Sincronizar com Notion
            if 'notion' in targets:
                try:
                    page = integrations_service.sync_task_to_notion_page(task, targets['notion'])
                    if page:
                        results['notion'].append(page)
                except Exception as e:
                    results['errors'].append(f"Notion: {str(e)}")
        
        return jsonify({
            'success': True,
            'results': results,
            'synced_tasks': len(tasks)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@integrations_bp.route('/test-connections', methods=['GET'])
def test_all_connections():
    """Testa todas as conexões das integrações"""
    try:
        results = {}
        
        # Testar GitHub
        try:
            repos = integrations_service.github_get_user_repos()
            results['github'] = {
                'status': 'connected',
                'repos_count': len(repos)
            }
        except Exception as e:
            results['github'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Testar Trello
        try:
            boards = integrations_service.trello_get_user_boards()
            results['trello'] = {
                'status': 'connected',
                'boards_count': len(boards)
            }
        except Exception as e:
            results['trello'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Testar Notion
        try:
            databases = integrations_service.notion_get_databases()
            results['notion'] = {
                'status': 'connected',
                'databases_count': len(databases)
            }
        except Exception as e:
            results['notion'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Testar Capacities
        try:
            objects = integrations_service.capacities_get_objects()
            results['capacities'] = {
                'status': 'connected',
                'objects_count': len(objects)
            }
        except Exception as e:
            results['capacities'] = {
                'status': 'error',
                'error': str(e)
            }
        
        # Obsidian sempre disponível (arquivos locais)
        results['obsidian'] = {
            'status': 'available',
            'note': 'Funciona com arquivos locais'
        }
        
        return jsonify({
            'success': True,
            'connections': results
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

