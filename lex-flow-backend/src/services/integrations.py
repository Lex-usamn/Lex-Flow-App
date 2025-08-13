"""
Serviço de Integrações com Ferramentas Externas
Suporte para Obsidian, Trello, Notion, GitHub e Capacities
"""

import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import base64
from urllib.parse import urlencode

class IntegrationsService:
    def __init__(self):
        self.github_token = os.getenv('GITHUB_TOKEN')
        self.trello_key = os.getenv('TRELLO_API_KEY')
        self.trello_token = os.getenv('TRELLO_TOKEN')
        self.notion_token = os.getenv('NOTION_TOKEN')
        self.capacities_token = os.getenv('CAPACITIES_TOKEN')
        
        # URLs base das APIs
        self.github_api = "https://api.github.com"
        self.trello_api = "https://api.trello.com/1"
        self.notion_api = "https://api.notion.com/v1"
        self.capacities_api = "https://api.capacities.io"
        
    def get_available_integrations(self) -> Dict[str, bool]:
        """Retorna quais integrações estão disponíveis baseado nas credenciais"""
        return {
            'github': bool(self.github_token),
            'trello': bool(self.trello_key and self.trello_token),
            'notion': bool(self.notion_token),
            'capacities': bool(self.capacities_token),
            'obsidian': True  # Obsidian usa arquivos locais
        }
    
    # ==================== GITHUB INTEGRATION ====================
    
    def github_get_user_repos(self, username: str = None) -> List[Dict]:
        """Obtém repositórios do usuário GitHub"""
        if not self.github_token:
            return []
            
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        try:
            if username:
                url = f"{self.github_api}/users/{username}/repos"
            else:
                url = f"{self.github_api}/user/repos"
                
            response = requests.get(url, headers=headers)
            response.raise_for_status()
            
            repos = response.json()
            return [{
                'id': repo['id'],
                'name': repo['name'],
                'full_name': repo['full_name'],
                'description': repo['description'],
                'url': repo['html_url'],
                'language': repo['language'],
                'stars': repo['stargazers_count'],
                'forks': repo['forks_count'],
                'updated_at': repo['updated_at'],
                'private': repo['private']
            } for repo in repos]
            
        except Exception as e:
            print(f"Erro ao buscar repositórios GitHub: {e}")
            return []
    
    def github_get_repo_issues(self, repo_full_name: str, state: str = 'open') -> List[Dict]:
        """Obtém issues de um repositório GitHub"""
        if not self.github_token:
            return []
            
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json'
        }
        
        try:
            url = f"{self.github_api}/repos/{repo_full_name}/issues"
            params = {'state': state, 'per_page': 50}
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            issues = response.json()
            return [{
                'id': issue['id'],
                'number': issue['number'],
                'title': issue['title'],
                'body': issue['body'],
                'state': issue['state'],
                'url': issue['html_url'],
                'created_at': issue['created_at'],
                'updated_at': issue['updated_at'],
                'labels': [label['name'] for label in issue['labels']],
                'assignees': [assignee['login'] for assignee in issue['assignees']]
            } for issue in issues if 'pull_request' not in issue]  # Filtrar PRs
            
        except Exception as e:
            print(f"Erro ao buscar issues GitHub: {e}")
            return []
    
    def github_create_issue(self, repo_full_name: str, title: str, body: str = "", labels: List[str] = None) -> Dict:
        """Cria uma issue no GitHub"""
        if not self.github_token:
            return {}
            
        headers = {
            'Authorization': f'token {self.github_token}',
            'Accept': 'application/vnd.github.v3+json',
            'Content-Type': 'application/json'
        }
        
        data = {
            'title': title,
            'body': body
        }
        
        if labels:
            data['labels'] = labels
        
        try:
            url = f"{self.github_api}/repos/{repo_full_name}/issues"
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            issue = response.json()
            return {
                'id': issue['id'],
                'number': issue['number'],
                'title': issue['title'],
                'url': issue['html_url'],
                'created_at': issue['created_at']
            }
            
        except Exception as e:
            print(f"Erro ao criar issue GitHub: {e}")
            return {}
    
    # ==================== TRELLO INTEGRATION ====================
    
    def trello_get_user_boards(self) -> List[Dict]:
        """Obtém boards do usuário Trello"""
        if not (self.trello_key and self.trello_token):
            return []
            
        try:
            url = f"{self.trello_api}/members/me/boards"
            params = {
                'key': self.trello_key,
                'token': self.trello_token,
                'fields': 'id,name,desc,url,dateLastActivity,prefs'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            boards = response.json()
            return [{
                'id': board['id'],
                'name': board['name'],
                'description': board.get('desc', ''),
                'url': board['url'],
                'last_activity': board.get('dateLastActivity'),
                'background': board.get('prefs', {}).get('background', 'blue')
            } for board in boards]
            
        except Exception as e:
            print(f"Erro ao buscar boards Trello: {e}")
            return []
    
    def trello_get_board_cards(self, board_id: str) -> List[Dict]:
        """Obtém cards de um board Trello"""
        if not (self.trello_key and self.trello_token):
            return []
            
        try:
            url = f"{self.trello_api}/boards/{board_id}/cards"
            params = {
                'key': self.trello_key,
                'token': self.trello_token,
                'fields': 'id,name,desc,url,dateLastActivity,due,labels,list'
            }
            
            response = requests.get(url, params=params)
            response.raise_for_status()
            
            cards = response.json()
            return [{
                'id': card['id'],
                'name': card['name'],
                'description': card.get('desc', ''),
                'url': card['url'],
                'due_date': card.get('due'),
                'last_activity': card.get('dateLastActivity'),
                'labels': [label['name'] for label in card.get('labels', [])],
                'list_id': card.get('list', {}).get('id') if card.get('list') else None
            } for card in cards]
            
        except Exception as e:
            print(f"Erro ao buscar cards Trello: {e}")
            return []
    
    def trello_create_card(self, list_id: str, name: str, desc: str = "", due_date: str = None) -> Dict:
        """Cria um card no Trello"""
        if not (self.trello_key and self.trello_token):
            return {}
            
        try:
            url = f"{self.trello_api}/cards"
            data = {
                'key': self.trello_key,
                'token': self.trello_token,
                'idList': list_id,
                'name': name,
                'desc': desc
            }
            
            if due_date:
                data['due'] = due_date
            
            response = requests.post(url, data=data)
            response.raise_for_status()
            
            card = response.json()
            return {
                'id': card['id'],
                'name': card['name'],
                'url': card['url'],
                'created_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            print(f"Erro ao criar card Trello: {e}")
            return {}
    
    # ==================== NOTION INTEGRATION ====================
    
    def notion_get_databases(self) -> List[Dict]:
        """Obtém databases do usuário Notion"""
        if not self.notion_token:
            return []
            
        headers = {
            'Authorization': f'Bearer {self.notion_token}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
        
        try:
            url = f"{self.notion_api}/search"
            data = {
                'filter': {
                    'value': 'database',
                    'property': 'object'
                }
            }
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            result = response.json()
            databases = result.get('results', [])
            
            return [{
                'id': db['id'],
                'title': db.get('title', [{}])[0].get('plain_text', 'Sem título') if db.get('title') else 'Sem título',
                'url': db['url'],
                'created_time': db['created_time'],
                'last_edited_time': db['last_edited_time']
            } for db in databases]
            
        except Exception as e:
            print(f"Erro ao buscar databases Notion: {e}")
            return []
    
    def notion_get_database_pages(self, database_id: str) -> List[Dict]:
        """Obtém páginas de um database Notion"""
        if not self.notion_token:
            return []
            
        headers = {
            'Authorization': f'Bearer {self.notion_token}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
        
        try:
            url = f"{self.notion_api}/databases/{database_id}/query"
            
            response = requests.post(url, headers=headers, json={})
            response.raise_for_status()
            
            result = response.json()
            pages = result.get('results', [])
            
            return [{
                'id': page['id'],
                'url': page['url'],
                'created_time': page['created_time'],
                'last_edited_time': page['last_edited_time'],
                'properties': self._extract_notion_properties(page.get('properties', {}))
            } for page in pages]
            
        except Exception as e:
            print(f"Erro ao buscar páginas Notion: {e}")
            return []
    
    def notion_create_page(self, database_id: str, properties: Dict) -> Dict:
        """Cria uma página no Notion"""
        if not self.notion_token:
            return {}
            
        headers = {
            'Authorization': f'Bearer {self.notion_token}',
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json'
        }
        
        try:
            url = f"{self.notion_api}/pages"
            data = {
                'parent': {'database_id': database_id},
                'properties': properties
            }
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            page = response.json()
            return {
                'id': page['id'],
                'url': page['url'],
                'created_time': page['created_time']
            }
            
        except Exception as e:
            print(f"Erro ao criar página Notion: {e}")
            return {}
    
    def _extract_notion_properties(self, properties: Dict) -> Dict:
        """Extrai propriedades de uma página Notion"""
        extracted = {}
        
        for key, prop in properties.items():
            prop_type = prop.get('type')
            
            if prop_type == 'title':
                extracted[key] = prop.get('title', [{}])[0].get('plain_text', '') if prop.get('title') else ''
            elif prop_type == 'rich_text':
                extracted[key] = prop.get('rich_text', [{}])[0].get('plain_text', '') if prop.get('rich_text') else ''
            elif prop_type == 'number':
                extracted[key] = prop.get('number')
            elif prop_type == 'select':
                extracted[key] = prop.get('select', {}).get('name') if prop.get('select') else None
            elif prop_type == 'date':
                extracted[key] = prop.get('date', {}).get('start') if prop.get('date') else None
            elif prop_type == 'checkbox':
                extracted[key] = prop.get('checkbox', False)
            else:
                extracted[key] = str(prop.get(prop_type, ''))
        
        return extracted
    
    # ==================== CAPACITIES INTEGRATION ====================
    
    def capacities_get_objects(self, structure_id: str = None) -> List[Dict]:
        """Obtém objetos do Capacities"""
        if not self.capacities_token:
            return []
            
        headers = {
            'Authorization': f'Bearer {self.capacities_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            url = f"{self.capacities_api}/objects"
            params = {}
            
            if structure_id:
                params['structureId'] = structure_id
            
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            
            result = response.json()
            objects = result.get('objects', [])
            
            return [{
                'id': obj['id'],
                'title': obj.get('title', 'Sem título'),
                'structure_id': obj.get('structureId'),
                'created_at': obj.get('createdAt'),
                'updated_at': obj.get('updatedAt'),
                'properties': obj.get('properties', {})
            } for obj in objects]
            
        except Exception as e:
            print(f"Erro ao buscar objetos Capacities: {e}")
            return []
    
    def capacities_create_object(self, structure_id: str, title: str, properties: Dict = None) -> Dict:
        """Cria um objeto no Capacities"""
        if not self.capacities_token:
            return {}
            
        headers = {
            'Authorization': f'Bearer {self.capacities_token}',
            'Content-Type': 'application/json'
        }
        
        try:
            url = f"{self.capacities_api}/objects"
            data = {
                'structureId': structure_id,
                'title': title
            }
            
            if properties:
                data['properties'] = properties
            
            response = requests.post(url, headers=headers, json=data)
            response.raise_for_status()
            
            obj = response.json()
            return {
                'id': obj['id'],
                'title': obj['title'],
                'created_at': obj.get('createdAt')
            }
            
        except Exception as e:
            print(f"Erro ao criar objeto Capacities: {e}")
            return {}
    
    # ==================== OBSIDIAN INTEGRATION ====================
    
    def obsidian_export_to_vault(self, vault_path: str, notes: List[Dict]) -> bool:
        """Exporta notas para um vault do Obsidian"""
        try:
            if not os.path.exists(vault_path):
                os.makedirs(vault_path)
            
            for note in notes:
                filename = f"{note.get('title', 'nota')}.md"
                # Sanitizar nome do arquivo
                filename = "".join(c for c in filename if c.isalnum() or c in (' ', '-', '_', '.')).rstrip()
                
                filepath = os.path.join(vault_path, filename)
                
                content = f"# {note.get('title', 'Sem título')}\n\n"
                content += f"**Criado em:** {note.get('created_at', '')}\n"
                content += f"**Categoria:** {note.get('category', 'Geral')}\n\n"
                content += note.get('content', '')
                
                # Adicionar tags se existirem
                if note.get('tags'):
                    content += f"\n\n**Tags:** {' '.join(['#' + tag for tag in note['tags']])}"
                
                with open(filepath, 'w', encoding='utf-8') as f:
                    f.write(content)
            
            return True
            
        except Exception as e:
            print(f"Erro ao exportar para Obsidian: {e}")
            return False
    
    def obsidian_import_from_vault(self, vault_path: str) -> List[Dict]:
        """Importa notas de um vault do Obsidian"""
        notes = []
        
        try:
            if not os.path.exists(vault_path):
                return notes
            
            for filename in os.listdir(vault_path):
                if filename.endswith('.md'):
                    filepath = os.path.join(vault_path, filename)
                    
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Extrair título (primeira linha com #)
                    lines = content.split('\n')
                    title = filename.replace('.md', '')
                    
                    for line in lines:
                        if line.startswith('# '):
                            title = line[2:].strip()
                            break
                    
                    # Extrair tags
                    tags = []
                    for line in lines:
                        if '#' in line and not line.startswith('#'):
                            # Buscar hashtags
                            words = line.split()
                            for word in words:
                                if word.startswith('#') and len(word) > 1:
                                    tags.append(word[1:])
                    
                    notes.append({
                        'title': title,
                        'content': content,
                        'filename': filename,
                        'tags': list(set(tags)),  # Remover duplicatas
                        'modified_at': datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                    })
            
            return notes
            
        except Exception as e:
            print(f"Erro ao importar do Obsidian: {e}")
            return []
    
    # ==================== SYNC METHODS ====================
    
    def sync_task_to_github_issue(self, task: Dict, repo_full_name: str) -> Dict:
        """Sincroniza uma tarefa como issue do GitHub"""
        title = task.get('title', 'Nova tarefa')
        body = f"**Descrição:** {task.get('description', '')}\n\n"
        body += f"**Prioridade:** {task.get('priority', 'Média')}\n"
        body += f"**Categoria:** {task.get('category', 'Geral')}\n"
        body += f"**Criado em:** {task.get('created_at', '')}\n\n"
        body += "Sincronizado automaticamente do Lex Flow"
        
        labels = ['lex-flow']
        if task.get('priority') == 'Alta':
            labels.append('high-priority')
        if task.get('category'):
            labels.append(task['category'].lower())
        
        return self.github_create_issue(repo_full_name, title, body, labels)
    
    def sync_task_to_trello_card(self, task: Dict, list_id: str) -> Dict:
        """Sincroniza uma tarefa como card do Trello"""
        name = task.get('title', 'Nova tarefa')
        desc = f"**Descrição:** {task.get('description', '')}\n\n"
        desc += f"**Prioridade:** {task.get('priority', 'Média')}\n"
        desc += f"**Categoria:** {task.get('category', 'Geral')}\n"
        desc += f"**Criado em:** {task.get('created_at', '')}\n\n"
        desc += "Sincronizado automaticamente do Lex Flow"
        
        due_date = task.get('due_date')
        
        return self.trello_create_card(list_id, name, desc, due_date)
    
    def sync_task_to_notion_page(self, task: Dict, database_id: str) -> Dict:
        """Sincroniza uma tarefa como página do Notion"""
        properties = {
            'Name': {
                'title': [
                    {
                        'text': {
                            'content': task.get('title', 'Nova tarefa')
                        }
                    }
                ]
            },
            'Status': {
                'select': {
                    'name': 'Pendente' if not task.get('completed') else 'Concluída'
                }
            },
            'Priority': {
                'select': {
                    'name': task.get('priority', 'Média')
                }
            },
            'Category': {
                'rich_text': [
                    {
                        'text': {
                            'content': task.get('category', 'Geral')
                        }
                    }
                ]
            }
        }
        
        if task.get('due_date'):
            properties['Due Date'] = {
                'date': {
                    'start': task['due_date']
                }
            }
        
        return self.notion_create_page(database_id, properties)
    
    def get_integration_stats(self) -> Dict:
        """Retorna estatísticas das integrações"""
        available = self.get_available_integrations()
        
        stats = {
            'total_integrations': len(available),
            'active_integrations': sum(available.values()),
            'integrations': available,
            'last_check': datetime.now().isoformat()
        }
        
        # Adicionar contadores específicos se as APIs estiverem disponíveis
        if available['github']:
            try:
                repos = self.github_get_user_repos()
                stats['github_repos_count'] = len(repos)
            except:
                stats['github_repos_count'] = 0
        
        if available['trello']:
            try:
                boards = self.trello_get_user_boards()
                stats['trello_boards_count'] = len(boards)
            except:
                stats['trello_boards_count'] = 0
        
        if available['notion']:
            try:
                databases = self.notion_get_databases()
                stats['notion_databases_count'] = len(databases)
            except:
                stats['notion_databases_count'] = 0
        
        return stats

