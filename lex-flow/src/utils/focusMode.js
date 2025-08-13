// Sistema de Modo Foco Avançado do Lex Flow

class FocusModeManager {
  constructor() {
    this.isActive = false
    this.startTime = null
    this.endTime = null
    this.blockedSites = this.loadBlockedSites()
    this.focusSettings = this.loadFocusSettings()
    this.focusSessions = this.loadFocusSessions()
    this.originalTitle = document.title
    
    this.init()
  }

  init() {
    // Monitorar mudanças de foco da janela
    window.addEventListener('focus', () => this.handleWindowFocus())
    window.addEventListener('blur', () => this.handleWindowBlur())
    
    // Monitorar mudanças de visibilidade
    document.addEventListener('visibilitychange', () => this.handleVisibilityChange())
    
    // Interceptar tentativas de navegação durante o foco
    window.addEventListener('beforeunload', (e) => this.handleBeforeUnload(e))
  }

  loadBlockedSites() {
    return JSON.parse(localStorage.getItem('lex-flow-blocked-sites') || JSON.stringify([
      'facebook.com',
      'instagram.com',
      'twitter.com',
      'youtube.com',
      'tiktok.com',
      'reddit.com',
      'netflix.com',
      'twitch.tv'
    ]))
  }

  loadFocusSettings() {
    return JSON.parse(localStorage.getItem('lex-flow-focus-settings') || JSON.stringify({
      blockSocialMedia: true,
      blockNews: false,
      blockEntertainment: true,
      allowBreaks: true,
      breakDuration: 5,
      strictMode: false,
      soundEnabled: true,
      visualCues: true,
      trackDistractions: true
    }))
  }

  loadFocusSessions() {
    return JSON.parse(localStorage.getItem('lex-flow-focus-sessions') || '[]')
  }

  saveBlockedSites() {
    localStorage.setItem('lex-flow-blocked-sites', JSON.stringify(this.blockedSites))
  }

  saveFocusSettings() {
    localStorage.setItem('lex-flow-focus-settings', JSON.stringify(this.focusSettings))
  }

  saveFocusSessions() {
    localStorage.setItem('lex-flow-focus-sessions', JSON.stringify(this.focusSessions))
  }

  startFocusMode(duration = 25, task = '') {
    if (this.isActive) return false

    this.isActive = true
    this.startTime = new Date()
    this.endTime = new Date(this.startTime.getTime() + duration * 60000)
    this.currentTask = task
    this.distractions = []
    this.windowBlurCount = 0
    
    // Aplicar configurações visuais
    this.applyFocusStyles()
    
    // Configurar timer
    this.focusTimer = setInterval(() => {
      this.updateFocusDisplay()
      
      if (new Date() >= this.endTime) {
        this.endFocusMode()
      }
    }, 1000)

    // Notificar início
    if (this.focusSettings.soundEnabled) {
      this.playFocusSound('start')
    }

    // Salvar sessão
    this.currentSession = {
      id: Date.now(),
      startTime: this.startTime.toISOString(),
      plannedDuration: duration,
      task: task,
      distractions: [],
      completed: false
    }

    return true
  }

  endFocusMode(completed = true) {
    if (!this.isActive) return false

    this.isActive = false
    clearInterval(this.focusTimer)
    
    // Remover estilos de foco
    this.removeFocusStyles()
    
    // Calcular estatísticas da sessão
    const actualDuration = Math.floor((new Date() - this.startTime) / 60000)
    
    this.currentSession.endTime = new Date().toISOString()
    this.currentSession.actualDuration = actualDuration
    this.currentSession.completed = completed
    this.currentSession.distractions = this.distractions
    this.currentSession.windowBlurCount = this.windowBlurCount
    this.currentSession.focusScore = this.calculateFocusScore()
    
    this.focusSessions.push(this.currentSession)
    this.saveFocusSessions()

    // Notificar fim
    if (this.focusSettings.soundEnabled) {
      this.playFocusSound(completed ? 'complete' : 'interrupted')
    }

    // Mostrar resumo da sessão
    this.showSessionSummary()

    return true
  }

  pauseFocusMode() {
    if (!this.isActive) return false
    
    this.isPaused = true
    this.pauseTime = new Date()
    clearInterval(this.focusTimer)
    
    return true
  }

  resumeFocusMode() {
    if (!this.isActive || !this.isPaused) return false
    
    // Ajustar tempo final baseado na pausa
    const pauseDuration = new Date() - this.pauseTime
    this.endTime = new Date(this.endTime.getTime() + pauseDuration)
    
    this.isPaused = false
    
    // Reiniciar timer
    this.focusTimer = setInterval(() => {
      this.updateFocusDisplay()
      
      if (new Date() >= this.endTime) {
        this.endFocusMode()
      }
    }, 1000)
    
    return true
  }

  applyFocusStyles() {
    // Adicionar classe de foco ao body
    document.body.classList.add('focus-mode-active')
    
    // Alterar título da página
    document.title = '🎯 MODO FOCO ATIVO - Lex Flow'
    
    // Aplicar overlay de foco se configurado
    if (this.focusSettings.visualCues) {
      this.createFocusOverlay()
    }
    
    // Adicionar estilos CSS dinâmicos
    if (!document.getElementById('focus-mode-styles')) {
      const style = document.createElement('style')
      style.id = 'focus-mode-styles'
      style.textContent = `
        .focus-mode-active {
          filter: contrast(1.1) saturate(0.9);
        }
        .focus-mode-active .focus-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.1);
          pointer-events: none;
          z-index: 9999;
          border: 3px solid #ef4444;
          box-shadow: inset 0 0 20px rgba(239, 68, 68, 0.3);
        }
        .focus-mode-active .focus-timer {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(239, 68, 68, 0.9);
          color: white;
          padding: 10px 15px;
          border-radius: 8px;
          font-weight: bold;
          z-index: 10000;
          font-family: monospace;
        }
      `
      document.head.appendChild(style)
    }
  }

  removeFocusStyles() {
    document.body.classList.remove('focus-mode-active')
    document.title = this.originalTitle
    
    const overlay = document.getElementById('focus-overlay')
    if (overlay) overlay.remove()
    
    const timer = document.getElementById('focus-timer')
    if (timer) timer.remove()
  }

  createFocusOverlay() {
    const overlay = document.createElement('div')
    overlay.id = 'focus-overlay'
    overlay.className = 'focus-overlay'
    document.body.appendChild(overlay)
    
    const timer = document.createElement('div')
    timer.id = 'focus-timer'
    timer.className = 'focus-timer'
    document.body.appendChild(timer)
  }

  updateFocusDisplay() {
    const timer = document.getElementById('focus-timer')
    if (timer && this.isActive) {
      const remaining = Math.max(0, this.endTime - new Date())
      const minutes = Math.floor(remaining / 60000)
      const seconds = Math.floor((remaining % 60000) / 1000)
      
      timer.textContent = `🎯 ${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
      
      if (this.currentTask) {
        timer.textContent += ` - ${this.currentTask}`
      }
    }
  }

  handleWindowFocus() {
    if (this.isActive && this.focusSettings.trackDistractions) {
      // Usuário voltou para a aplicação
      if (this.lastBlurTime) {
        const distractionDuration = new Date() - this.lastBlurTime
        if (distractionDuration > 5000) { // Mais de 5 segundos
          this.distractions.push({
            type: 'window_blur',
            duration: distractionDuration,
            timestamp: new Date().toISOString()
          })
        }
      }
    }
  }

  handleWindowBlur() {
    if (this.isActive) {
      this.windowBlurCount++
      this.lastBlurTime = new Date()
      
      if (this.focusSettings.strictMode) {
        // Em modo estrito, pausar automaticamente
        this.pauseFocusMode()
      }
    }
  }

  handleVisibilityChange() {
    if (this.isActive && document.hidden) {
      this.handleWindowBlur()
    } else if (this.isActive && !document.hidden) {
      this.handleWindowFocus()
    }
  }

  handleBeforeUnload(e) {
    if (this.isActive && this.focusSettings.strictMode) {
      e.preventDefault()
      e.returnValue = 'Você está no modo foco. Tem certeza que deseja sair?'
      return e.returnValue
    }
  }

  calculateFocusScore() {
    if (!this.currentSession) return 0
    
    const plannedDuration = this.currentSession.plannedDuration * 60000
    const actualDuration = new Date() - this.startTime
    const completionRate = Math.min(actualDuration / plannedDuration, 1)
    
    // Penalizar distrações
    const distractionPenalty = Math.min(this.distractions.length * 5, 30)
    const blurPenalty = Math.min(this.windowBlurCount * 2, 20)
    
    const baseScore = completionRate * 100
    const finalScore = Math.max(0, baseScore - distractionPenalty - blurPenalty)
    
    return Math.round(finalScore)
  }

  playFocusSound(type) {
    // Criar sons usando Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    switch (type) {
      case 'start':
        oscillator.frequency.setValueAtTime(440, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(880, audioContext.currentTime + 0.1)
        break
      case 'complete':
        oscillator.frequency.setValueAtTime(523, audioContext.currentTime)
        oscillator.frequency.setValueAtTime(659, audioContext.currentTime + 0.1)
        oscillator.frequency.setValueAtTime(784, audioContext.currentTime + 0.2)
        break
      case 'interrupted':
        oscillator.frequency.setValueAtTime(220, audioContext.currentTime)
        break
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.3)
  }

  showSessionSummary() {
    if (!this.currentSession) return
    
    const summary = {
      duration: `${this.currentSession.actualDuration} minutos`,
      task: this.currentSession.task || 'Sem tarefa específica',
      distractions: this.distractions.length,
      focusScore: this.currentSession.focusScore,
      completed: this.currentSession.completed
    }
    
    // Mostrar notificação de resumo
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎯 Sessão de Foco Concluída', {
        body: `Duração: ${summary.duration} | Score: ${summary.focusScore}% | Distrações: ${summary.distractions}`,
        icon: '/favicon.ico'
      })
    }
    
    return summary
  }

  addBlockedSite(site) {
    if (!this.blockedSites.includes(site)) {
      this.blockedSites.push(site)
      this.saveBlockedSites()
    }
  }

  removeBlockedSite(site) {
    this.blockedSites = this.blockedSites.filter(s => s !== site)
    this.saveBlockedSites()
  }

  updateSettings(newSettings) {
    this.focusSettings = { ...this.focusSettings, ...newSettings }
    this.saveFocusSettings()
  }

  getFocusStats() {
    const sessions = this.focusSessions
    const today = new Date().toDateString()
    const thisWeek = new Date()
    thisWeek.setDate(thisWeek.getDate() - 7)
    
    return {
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.completed).length,
      totalFocusTime: sessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
      averageFocusScore: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / sessions.length)
        : 0,
      todaySessions: sessions.filter(s => new Date(s.startTime).toDateString() === today).length,
      weekSessions: sessions.filter(s => new Date(s.startTime) >= thisWeek).length,
      totalDistractions: sessions.reduce((sum, s) => sum + (s.distractions?.length || 0), 0),
      averageSessionLength: sessions.length > 0
        ? Math.round(sessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0) / sessions.length)
        : 0
    }
  }

  exportFocusData() {
    const data = {
      sessions: this.focusSessions,
      settings: this.focusSettings,
      blockedSites: this.blockedSites,
      stats: this.getFocusStats(),
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `lex-flow-focus-data-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  getStatus() {
    return {
      isActive: this.isActive,
      isPaused: this.isPaused || false,
      startTime: this.startTime,
      endTime: this.endTime,
      currentTask: this.currentTask,
      timeRemaining: this.isActive ? Math.max(0, this.endTime - new Date()) : 0,
      distractions: this.distractions?.length || 0
    }
  }
}

// Instância global
export const focusModeManager = new FocusModeManager()

// Funções de conveniência
export const startFocusMode = (duration, task) => focusModeManager.startFocusMode(duration, task)
export const endFocusMode = (completed) => focusModeManager.endFocusMode(completed)
export const pauseFocusMode = () => focusModeManager.pauseFocusMode()
export const resumeFocusMode = () => focusModeManager.resumeFocusMode()
export const getFocusStatus = () => focusModeManager.getStatus()
export const getFocusStats = () => focusModeManager.getFocusStats()
export const updateFocusSettings = (settings) => focusModeManager.updateSettings(settings)
export const exportFocusData = () => focusModeManager.exportFocusData()

