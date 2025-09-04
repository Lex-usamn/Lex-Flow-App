// Sistema de Notificações do Lex Flow

class NotificationManager {
  constructor() {
    this.permission = 'default'
    this.init()
  }

  async init() {
    if ('Notification' in window) {
      this.permission = await this.requestPermission()
    }
  }

  async requestPermission() {
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission()
      return permission
    }
    return Notification.permission
  }

  show(title, options = {}) {
    if (this.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      })

      // Auto-close após 5 segundos
      setTimeout(() => {
        notification.close()
      }, 5000)

      return notification
    }
  }

  // Notificações específicas do Lex Flow
  pomodoroStart(sessionType = 'trabalho') {
    return this.show('🍅 Pomodoro Iniciado', {
      body: `Sessão de ${sessionType} começou. Mantenha o foco!`,
      tag: 'pomodoro-start'
    })
  }

  pomodoroEnd(sessionType = 'trabalho') {
    return this.show('⏰ Pomodoro Finalizado', {
      body: `Sessão de ${sessionType} concluída. Hora do intervalo!`,
      tag: 'pomodoro-end'
    })
  }

  breakStart(breakType = 'curto') {
    return this.show('☕ Intervalo Iniciado', {
      body: `Intervalo ${breakType} começou. Relaxe um pouco!`,
      tag: 'break-start'
    })
  }

  breakEnd() {
    return this.show('🎯 Intervalo Finalizado', {
      body: 'Hora de voltar ao trabalho. Vamos lá!',
      tag: 'break-end'
    })
  }

  taskReminder(taskTitle) {
    return this.show('📋 Lembrete de Tarefa', {
      body: `Não esqueça: ${taskTitle}`,
      tag: 'task-reminder'
    })
  }

  telosReminder() {
    return this.show('🎯 Hora da Reflexão', {
      body: 'Que tal fazer sua revisão TELOS do dia?',
      tag: 'telos-reminder'
    })
  }

  dailyMotivation(quote) {
    return this.show('💡 Frase do Dia', {
      body: quote,
      tag: 'daily-motivation'
    })
  }

  studyReminder(videoTitle) {
    return this.show('📚 Lembrete de Estudo', {
      body: `Continue assistindo: ${videoTitle}`,
      tag: 'study-reminder'
    })
  }
}

// Instância global
export const notificationManager = new NotificationManager()

// Funções de conveniência
export const requestNotificationPermission = () => notificationManager.requestPermission()
export const showNotification = (title, options) => notificationManager.show(title, options)
export const pomodoroNotifications = {
  start: (type) => notificationManager.pomodoroStart(type),
  end: (type) => notificationManager.pomodoroEnd(type),
  breakStart: (type) => notificationManager.breakStart(type),
  breakEnd: () => notificationManager.breakEnd()
}
export const taskNotifications = {
  reminder: (title) => notificationManager.taskReminder(title)
}
export const telosNotifications = {
  reminder: () => notificationManager.telosReminder()
}
export const studyNotifications = {
  reminder: (title) => notificationManager.studyReminder(title)
}
export const dailyNotifications = {
  motivation: (quote) => notificationManager.dailyMotivation(quote)
}

