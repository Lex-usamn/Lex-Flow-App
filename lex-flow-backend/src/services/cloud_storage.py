import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
import base64
from cryptography.fernet import Fernet

class CloudStorageService:
    """Classe base para serviços de armazenamento em nuvem"""
    
    def __init__(self, encryption_key: str = None):
        self.encryption_key = encryption_key or os.environ.get('ENCRYPTION_KEY')
        if self.encryption_key:
            self.cipher = Fernet(self.encryption_key.encode())
    
    def encrypt_token(self, token: str) -> str:
        """Criptografa um token"""
        if self.cipher:
            return self.cipher.encrypt(token.encode()).decode()
        return token
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Descriptografa um token"""
        if self.cipher:
            return self.cipher.decrypt(encrypted_token.encode()).decode()
        return encrypted_token
    
    def upload_file(self, file_path: str, content: bytes) -> Dict[str, Any]:
        """Upload de arquivo - deve ser implementado pelas subclasses"""
        raise NotImplementedError
    
    def download_file(self, file_id: str) -> bytes:
        """Download de arquivo - deve ser implementado pelas subclasses"""
        raise NotImplementedError
    
    def list_files(self, folder_id: str = None) -> List[Dict[str, Any]]:
        """Lista arquivos - deve ser implementado pelas subclasses"""
        raise NotImplementedError
    
    def delete_file(self, file_id: str) -> bool:
        """Deleta arquivo - deve ser implementado pelas subclasses"""
        raise NotImplementedError

class GoogleDriveService(CloudStorageService):
    """Serviço para integração com Google Drive"""
    
    def __init__(self, encryption_key: str = None):
        super().__init__(encryption_key)
        self.base_url = "https://www.googleapis.com/drive/v3"
        self.upload_url = "https://www.googleapis.com/upload/drive/v3"
    
    def get_auth_url(self, client_id: str, redirect_uri: str) -> str:
        """Gera URL de autenticação OAuth2"""
        scopes = "https://www.googleapis.com/auth/drive.file"
        auth_url = (
            f"https://accounts.google.com/o/oauth2/v2/auth?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"scope={scopes}&"
            f"response_type=code&"
            f"access_type=offline&"
            f"prompt=consent"
        )
        return auth_url
    
    def exchange_code_for_tokens(self, code: str, client_id: str, 
                                client_secret: str, redirect_uri: str) -> Dict[str, Any]:
        """Troca código de autorização por tokens"""
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            'code': code,
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        response = requests.post(token_url, data=data)
        return response.json()
    
    def refresh_access_token(self, refresh_token: str, client_id: str, 
                           client_secret: str) -> Dict[str, Any]:
        """Atualiza access token usando refresh token"""
        token_url = "https://oauth2.googleapis.com/token"
        data = {
            'refresh_token': refresh_token,
            'client_id': client_id,
            'client_secret': client_secret,
            'grant_type': 'refresh_token'
        }
        
        response = requests.post(token_url, data=data)
        return response.json()
    
    def upload_file(self, file_name: str, content: bytes, access_token: str, 
                   folder_id: str = None) -> Dict[str, Any]:
        """Upload de arquivo para Google Drive"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        # Metadados do arquivo
        metadata = {
            'name': file_name
        }
        
        if folder_id:
            metadata['parents'] = [folder_id]
        
        # Upload multipart
        files = {
            'metadata': (None, json.dumps(metadata), 'application/json'),
            'media': (file_name, content, 'application/octet-stream')
        }
        
        response = requests.post(
            f"{self.upload_url}/files?uploadType=multipart",
            headers={'Authorization': f'Bearer {access_token}'},
            files=files
        )
        
        return response.json()
    
    def download_file(self, file_id: str, access_token: str) -> bytes:
        """Download de arquivo do Google Drive"""
        headers = {'Authorization': f'Bearer {access_token}'}
        response = requests.get(
            f"{self.base_url}/files/{file_id}?alt=media",
            headers=headers
        )
        return response.content
    
    def list_files(self, access_token: str, folder_id: str = None, 
                  query: str = None) -> List[Dict[str, Any]]:
        """Lista arquivos do Google Drive"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        params = {
            'fields': 'files(id,name,mimeType,size,createdTime,modifiedTime,parents)'
        }
        
        if query:
            params['q'] = query
        elif folder_id:
            params['q'] = f"'{folder_id}' in parents"
        
        response = requests.get(f"{self.base_url}/files", headers=headers, params=params)
        return response.json().get('files', [])
    
    def create_folder(self, folder_name: str, access_token: str, 
                     parent_folder_id: str = None) -> Dict[str, Any]:
        """Cria pasta no Google Drive"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        metadata = {
            'name': folder_name,
            'mimeType': 'application/vnd.google-apps.folder'
        }
        
        if parent_folder_id:
            metadata['parents'] = [parent_folder_id]
        
        response = requests.post(
            f"{self.base_url}/files",
            headers=headers,
            json=metadata
        )
        
        return response.json()

class DropboxService(CloudStorageService):
    """Serviço para integração com Dropbox"""
    
    def __init__(self, encryption_key: str = None):
        super().__init__(encryption_key)
        self.base_url = "https://api.dropboxapi.com/2"
        self.content_url = "https://content.dropboxapi.com/2"
    
    def get_auth_url(self, client_id: str, redirect_uri: str) -> str:
        """Gera URL de autenticação OAuth2"""
        auth_url = (
            f"https://www.dropbox.com/oauth2/authorize?"
            f"client_id={client_id}&"
            f"redirect_uri={redirect_uri}&"
            f"response_type=code&"
            f"token_access_type=offline"
        )
        return auth_url
    
    def exchange_code_for_tokens(self, code: str, client_id: str, 
                                client_secret: str, redirect_uri: str) -> Dict[str, Any]:
        """Troca código de autorização por tokens"""
        token_url = "https://api.dropboxapi.com/oauth2/token"
        data = {
            'code': code,
            'grant_type': 'authorization_code',
            'client_id': client_id,
            'client_secret': client_secret,
            'redirect_uri': redirect_uri
        }
        
        response = requests.post(token_url, data=data)
        return response.json()
    
    def refresh_access_token(self, refresh_token: str, client_id: str, 
                           client_secret: str) -> Dict[str, Any]:
        """Atualiza access token usando refresh token"""
        token_url = "https://api.dropboxapi.com/oauth2/token"
        data = {
            'grant_type': 'refresh_token',
            'refresh_token': refresh_token,
            'client_id': client_id,
            'client_secret': client_secret
        }
        
        response = requests.post(token_url, data=data)
        return response.json()
    
    def upload_file(self, file_path: str, content: bytes, access_token: str) -> Dict[str, Any]:
        """Upload de arquivo para Dropbox"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Dropbox-API-Arg': json.dumps({
                'path': file_path,
                'mode': 'overwrite',
                'autorename': True
            }),
            'Content-Type': 'application/octet-stream'
        }
        
        response = requests.post(
            f"{self.content_url}/files/upload",
            headers=headers,
            data=content
        )
        
        return response.json()
    
    def download_file(self, file_path: str, access_token: str) -> bytes:
        """Download de arquivo do Dropbox"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Dropbox-API-Arg': json.dumps({'path': file_path})
        }
        
        response = requests.post(
            f"{self.content_url}/files/download",
            headers=headers
        )
        
        return response.content
    
    def list_files(self, access_token: str, folder_path: str = "") -> List[Dict[str, Any]]:
        """Lista arquivos do Dropbox"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/json'
        }
        
        data = {
            'path': folder_path,
            'recursive': False,
            'include_media_info': False,
            'include_deleted': False
        }
        
        response = requests.post(
            f"{self.base_url}/files/list_folder",
            headers=headers,
            json=data
        )
        
        result = response.json()
        return result.get('entries', [])

class OneDriveService(CloudStorageService):
    """Serviço para integração com Microsoft OneDrive"""
    
    def __init__(self, encryption_key: str = None):
        super().__init__(encryption_key)
        self.base_url = "https://graph.microsoft.com/v1.0"
    
    def get_auth_url(self, client_id: str, redirect_uri: str) -> str:
        """Gera URL de autenticação OAuth2"""
        scopes = "Files.ReadWrite offline_access"
        auth_url = (
            f"https://login.microsoftonline.com/common/oauth2/v2.0/authorize?"
            f"client_id={client_id}&"
            f"response_type=code&"
            f"redirect_uri={redirect_uri}&"
            f"scope={scopes}&"
            f"response_mode=query"
        )
        return auth_url
    
    def exchange_code_for_tokens(self, code: str, client_id: str, 
                                client_secret: str, redirect_uri: str) -> Dict[str, Any]:
        """Troca código de autorização por tokens"""
        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'code': code,
            'redirect_uri': redirect_uri,
            'grant_type': 'authorization_code'
        }
        
        response = requests.post(token_url, data=data)
        return response.json()
    
    def refresh_access_token(self, refresh_token: str, client_id: str, 
                           client_secret: str) -> Dict[str, Any]:
        """Atualiza access token usando refresh token"""
        token_url = "https://login.microsoftonline.com/common/oauth2/v2.0/token"
        data = {
            'client_id': client_id,
            'client_secret': client_secret,
            'refresh_token': refresh_token,
            'grant_type': 'refresh_token'
        }
        
        response = requests.post(token_url, data=data)
        return response.json()
    
    def upload_file(self, file_name: str, content: bytes, access_token: str, 
                   folder_path: str = "") -> Dict[str, Any]:
        """Upload de arquivo para OneDrive"""
        headers = {
            'Authorization': f'Bearer {access_token}',
            'Content-Type': 'application/octet-stream'
        }
        
        # Construir caminho do arquivo
        if folder_path:
            upload_path = f"{folder_path}/{file_name}"
        else:
            upload_path = file_name
        
        response = requests.put(
            f"{self.base_url}/me/drive/root:/{upload_path}:/content",
            headers=headers,
            data=content
        )
        
        return response.json()
    
    def download_file(self, file_id: str, access_token: str) -> bytes:
        """Download de arquivo do OneDrive"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        response = requests.get(
            f"{self.base_url}/me/drive/items/{file_id}/content",
            headers=headers
        )
        
        return response.content
    
    def list_files(self, access_token: str, folder_id: str = None) -> List[Dict[str, Any]]:
        """Lista arquivos do OneDrive"""
        headers = {'Authorization': f'Bearer {access_token}'}
        
        if folder_id:
            url = f"{self.base_url}/me/drive/items/{folder_id}/children"
        else:
            url = f"{self.base_url}/me/drive/root/children"
        
        response = requests.get(url, headers=headers)
        result = response.json()
        return result.get('value', [])

class CloudSyncManager:
    """Gerenciador de sincronização entre diferentes provedores de nuvem"""
    
    def __init__(self):
        self.providers = {
            'google_drive': GoogleDriveService(),
            'dropbox': DropboxService(),
            'onedrive': OneDriveService()
        }
    
    def get_provider(self, provider_name: str) -> CloudStorageService:
        """Retorna instância do provedor especificado"""
        return self.providers.get(provider_name)
    
    def sync_user_data(self, user_id: int, provider: str, access_token: str) -> Dict[str, Any]:
        """Sincroniza dados do usuário com o provedor especificado"""
        service = self.get_provider(provider)
        if not service:
            return {'error': 'Provider not supported'}
        
        try:
            # Criar estrutura de pastas do Lex Flow
            lex_flow_folder = self.ensure_lex_flow_folder(service, access_token)
            
            # Sincronizar diferentes tipos de dados
            sync_results = {
                'tasks': self.sync_tasks(service, access_token, lex_flow_folder, user_id),
                'projects': self.sync_projects(service, access_token, lex_flow_folder, user_id),
                'notes': self.sync_notes(service, access_token, lex_flow_folder, user_id),
                'settings': self.sync_settings(service, access_token, lex_flow_folder, user_id)
            }
            
            return {
                'success': True,
                'provider': provider,
                'sync_results': sync_results,
                'synced_at': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'provider': provider
            }
    
    def ensure_lex_flow_folder(self, service: CloudStorageService, access_token: str) -> str:
        """Garante que a pasta Lex Flow existe no provedor"""
        # Implementação específica para cada provedor
        if isinstance(service, GoogleDriveService):
            # Verificar se pasta já existe
            files = service.list_files(access_token, query="name='Lex Flow' and mimeType='application/vnd.google-apps.folder'")
            if files:
                return files[0]['id']
            else:
                # Criar pasta
                folder = service.create_folder('Lex Flow', access_token)
                return folder['id']
        
        # Para outros provedores, implementar lógica similar
        return "lex_flow"
    
    def sync_tasks(self, service: CloudStorageService, access_token: str, 
                  folder_id: str, user_id: int) -> Dict[str, Any]:
        """Sincroniza tarefas do usuário"""
        # Buscar tarefas do banco de dados
        from src.models.project import Task
        tasks = Task.query.filter_by(created_by=user_id).all()
        
        # Converter para JSON
        tasks_data = {
            'tasks': [task.to_dict() for task in tasks],
            'exported_at': datetime.utcnow().isoformat(),
            'version': '1.0'
        }
        
        # Upload para nuvem
        content = json.dumps(tasks_data, indent=2).encode('utf-8')
        result = service.upload_file('tasks.json', content, access_token, folder_id)
        
        return {
            'file_name': 'tasks.json',
            'task_count': len(tasks),
            'upload_result': result
        }
    
    def sync_projects(self, service: CloudStorageService, access_token: str, 
                     folder_id: str, user_id: int) -> Dict[str, Any]:
        """Sincroniza projetos do usuário"""
        from src.models.project import Project
        projects = Project.query.filter_by(owner_id=user_id).all()
        
        projects_data = {
            'projects': [project.to_dict() for project in projects],
            'exported_at': datetime.utcnow().isoformat(),
            'version': '1.0'
        }
        
        content = json.dumps(projects_data, indent=2).encode('utf-8')
        result = service.upload_file('projects.json', content, access_token, folder_id)
        
        return {
            'file_name': 'projects.json',
            'project_count': len(projects),
            'upload_result': result
        }
    
    def sync_notes(self, service: CloudStorageService, access_token: str, 
                  folder_id: str, user_id: int) -> Dict[str, Any]:
        """Sincroniza anotações do usuário"""
        # Implementar quando tivermos modelo de notas
        return {
            'file_name': 'notes.json',
            'note_count': 0,
            'status': 'not_implemented'
        }
    
    def sync_settings(self, service: CloudStorageService, access_token: str, 
                     folder_id: str, user_id: int) -> Dict[str, Any]:
        """Sincroniza configurações do usuário"""
        from src.models.user import User
        user = User.query.get(user_id)
        
        if user:
            settings_data = {
                'user_preferences': {},  # Implementar quando tivermos preferências
                'exported_at': datetime.utcnow().isoformat(),
                'version': '1.0'
            }
            
            content = json.dumps(settings_data, indent=2).encode('utf-8')
            result = service.upload_file('settings.json', content, access_token, folder_id)
            
            return {
                'file_name': 'settings.json',
                'upload_result': result
            }
        
        return {'error': 'User not found'}

