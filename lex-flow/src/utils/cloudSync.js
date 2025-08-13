// src/utils/cloudSync.js (VERSÃO COMPLETA E FINAL)

// O QUE MUDOU: Importamos os utilitários de autenticação que criamos.
import { authenticatedFetch, getToken } from './auth.js';

class CloudSyncManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.lastSync = null;
    this.pendingChanges = [];
    
    // O QUE MUDOU: O sync não é mais habilitado/desabilitado manualmente aqui.
    // Ele depende do usuário estar logado.
    this.init();
  }

  init() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncPendingChanges();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // O QUE MUDOU: O auto-sync agora verifica se há um token.
    setInterval(() => {
      if (getToken() && this.isOnline) {
        this.syncData();
      }
    }, 5 * 60 * 1000); // 5 minutos
  }
  
  // REMOVIDO: loadSyncSettings, saveSyncSettings, enableSync, disableSync
  // A lógica de "sync habilitado" agora é simplesmente se o usuário está logado ou não.

  collectAppData() {
    return {
      tasks: JSON.parse(localStorage.getItem('lex-flow-tasks') || '[]'),
      priorities: JSON.parse(localStorage.getItem('lex-flow-priorities') || '[]'),
      videos: JSON.parse(localStorage.getItem('lex-flow-videos') || '[]'),
      notes: JSON.parse(localStorage.getItem('lex-flow-notes') || '[]'),
      telosReviews: JSON.parse(localStorage.getItem('lex-flow-telos-reviews') || '[]'),
      pomodoroSettings: JSON.parse(localStorage.getItem('lex-flow-pomodoro-settings') || '{}'),
      pomodoroStats: JSON.parse(localStorage.getItem('lex-flow-pomodoro-stats') || '{}'),
      theme: localStorage.getItem('lex-flow-theme') || 'light',
      gamification: JSON.parse(localStorage.getItem('lex-flow-gamification') || '{}'),
      lastModified: new Date().toISOString()
    };
  }

  restoreAppData(data) {
    if (!data) return; // Não restaura nada se os dados forem nulos
    if (data.tasks) localStorage.setItem('lex-flow-tasks', JSON.stringify(data.tasks));
    if (data.priorities) localStorage.setItem('lex-flow-priorities', JSON.stringify(data.priorities));
    if (data.videos) localStorage.setItem('lex-flow-videos', JSON.stringify(data.videos));
    if (data.notes) localStorage.setItem('lex-flow-notes', JSON.stringify(data.notes));
    if (data.telosReviews) localStorage.setItem('lex-flow-telos-reviews', JSON.stringify(data.telosReviews));
    if (data.pomodoroSettings) localStorage.setItem('lex-flow-pomodoro-settings', JSON.stringify(data.pomodoroSettings));
    if (data.pomodoroStats) localStorage.setItem('lex-flow-pomodoro-stats', JSON.stringify(data.pomodoroStats));
    if (data.theme) localStorage.setItem('lex-flow-theme', data.theme);
    if (data.gamification) localStorage.setItem('lex-flow-gamification', JSON.stringify(data.gamification));
  }

  // O QUE MUDOU: Esta função agora faz uma chamada de API real.
  async syncToCloud(data) {
    try {
      const response = await authenticatedFetch(`${window.location.origin}/api/cloud/data`, {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response && response.ok) {
        const result = await response.json();
        return { success: true, lastSync: result.last_sync };
      } else {
        const errorData = response ? await response.json() : { error: 'Network error' };
        console.error('Falha ao sincronizar para a nuvem:', errorData);
        return { success: false, error: errorData.error || 'Failed to sync to cloud' };
      }
    } catch (error) {
      console.error('Erro de rede ao sincronizar com nuvem:', error);
      return { success: false, error: error.message };
    }
  }

  // O QUE MUDOU: Esta função agora faz uma chamada de API real.
  async syncFromCloud() {
    try {
      const response = await authenticatedFetch(`${window.location.origin}/api/cloud/data`);
      
      if (response && response.ok) {
        const result = await response.json();
        return { success: true, data: result.data, lastSync: result.last_sync };
      } else {
        const errorData = response ? await response.json() : { error: 'Network error' };
        // Não logamos erro se for apenas "nenhum backup encontrado", isso é esperado para novos usuários
        if(response?.status !== 404 && errorData.error !== 'Nenhum dado encontrado na nuvem.') {
            console.error('Falha ao buscar da nuvem:', errorData);
        }
        return { success: false, error: errorData.error || 'No backup found' };
      }
    } catch (error) {
      console.error('Erro de rede ao baixar da nuvem:', error);
      return { success: false, error: error.message };
    }
  }
  
  async syncData() {
    if (!getToken() || !this.isOnline) {
      return { success: false, error: 'Login necessário ou offline' };
    }

    try {
      const localData = this.collectAppData();
      const result = await this.syncToCloud(localData);
      
      if (result.success) {
        this.lastSync = result.lastSync;
        this.pendingChanges = []; // Limpa as alterações pendentes
      }
      return result;
    } catch (error) {
      console.error('Erro na sincronização:', error);
      return { success: false, error: error.message };
    }
  }

  async restoreFromCloud() {
    if (!getToken() || !this.isOnline) {
      return { success: false, error: 'Login necessário ou offline' };
    }

    try {
      const result = await this.syncFromCloud();
      if (result.success && result.data) {
        this.restoreAppData(result.data);
        this.lastSync = result.lastSync;
        return { success: true, message: 'Dados restaurados com sucesso' };
      }
      return { success: false, error: result.error || 'Nenhum dado para restaurar.' };
    } catch (error) {
      console.error('Erro ao restaurar da nuvem:', error);
      return { success: false, error: error.message };
    }
  }

  exportData() {
    const data = this.collectAppData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `lex-flow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async importData(file) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      if (this.validateBackupData(data)) {
        this.restoreAppData(data);
        return { success: true, message: 'Dados importados com sucesso' };
      } else {
        return { success: false, error: 'Arquivo de backup inválido' };
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      return { success: false, error: 'Erro ao processar arquivo' };
    }
  }

  validateBackupData(data) {
    return data && typeof data === 'object' && data.lastModified;
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('lex-flow-device-id');
    if (!deviceId) {
      deviceId = 'device-' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('lex-flow-device-id', deviceId);
    }
    return deviceId;
  }

  addPendingChange(change) {
    this.pendingChanges.push({
      ...change,
      timestamp: new Date().toISOString()
    });
  }

  async syncPendingChanges() {
    if (this.pendingChanges.length > 0 && getToken() && this.isOnline) {
      await this.syncData();
    }
  }

  getSyncStatus() {
    return {
      enabled: !!getToken(),
      online: this.isOnline,
      lastSync: this.lastSync,
      pendingChanges: this.pendingChanges.length
    };
  }
}

export const cloudSync = new CloudSyncManager();

// O QUE MUDOU: Funções de conveniência adaptadas para o novo fluxo.
export const syncNow = () => cloudSync.syncData();
export const restoreDataOnLogin = () => cloudSync.restoreFromCloud();
export const exportBackup = () => cloudSync.exportData();
export const importBackup = (file) => cloudSync.importData(file);
export const getSyncStatus = () => cloudSync.getSyncStatus();