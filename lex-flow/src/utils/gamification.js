// Sistema de Gamificação do Lex Flow

class GamificationManager {
  constructor() {
    this.achievements = this.loadAchievements()
    this.userStats = this.loadUserStats()
    this.streaks = this.loadStreaks()
    this.levels = this.defineLevels()
    this.badges = this.defineBadges()
    
    this.init()
  }

  init() {
    // Verificar conquistas diariamente
    this.checkDailyAchievements()
    
    // Configurar verificação automática
    setInterval(() => {
      this.checkDailyAchievements()
    }, 60 * 60 * 1000) // A cada hora
  }

  loadAchievements() {
    return JSON.parse(localStorage.getItem('lex-flow-achievements') || '[]')
  }

  loadUserStats() {
    const defaultStats = {
      totalPoints: 0,
      level: 1,
      experience: 0,
      tasksCompleted: 0,
      pomodorosCompleted: 0,
      studyHours: 0,
      telosReviews: 0,
      focusHours: 0,
      notesCreated: 0,
      daysActive: 0,
      longestStreak: 0,
      currentStreak: 0,
      joinDate: new Date().toISOString()
    }
    
    return JSON.parse(localStorage.getItem('lex-flow-user-stats') || JSON.stringify(defaultStats))
  }

  loadStreaks() {
    const defaultStreaks = {
      daily: { count: 0, lastDate: null },
      pomodoro: { count: 0, lastDate: null },
      study: { count: 0, lastDate: null },
      telos: { count: 0, lastDate: null }
    }
    
    return JSON.parse(localStorage.getItem('lex-flow-streaks') || JSON.stringify(defaultStreaks))
  }

  saveAchievements() {
    localStorage.setItem('lex-flow-achievements', JSON.stringify(this.achievements))
  }

  saveUserStats() {
    localStorage.setItem('lex-flow-user-stats', JSON.stringify(this.userStats))
  }

  saveStreaks() {
    localStorage.setItem('lex-flow-streaks', JSON.stringify(this.streaks))
  }

  defineLevels() {
    return [
      { level: 1, name: 'Iniciante', minXP: 0, maxXP: 100, color: '#94a3b8' },
      { level: 2, name: 'Aprendiz', minXP: 100, maxXP: 250, color: '#22c55e' },
      { level: 3, name: 'Praticante', minXP: 250, maxXP: 500, color: '#3b82f6' },
      { level: 4, name: 'Experiente', minXP: 500, maxXP: 1000, color: '#8b5cf6' },
      { level: 5, name: 'Especialista', minXP: 1000, maxXP: 2000, color: '#f59e0b' },
      { level: 6, name: 'Mestre', minXP: 2000, maxXP: 4000, color: '#ef4444' },
      { level: 7, name: 'Guru', minXP: 4000, maxXP: 8000, color: '#ec4899' },
      { level: 8, name: 'Lenda', minXP: 8000, maxXP: 16000, color: '#06b6d4' },
      { level: 9, name: 'Mito', minXP: 16000, maxXP: 32000, color: '#84cc16' },
      { level: 10, name: 'Transcendente', minXP: 32000, maxXP: Infinity, color: '#fbbf24' }
    ]
  }

  defineBadges() {
    return {
      // Badges de Tarefas
      firstTask: {
        id: 'first-task',
        name: 'Primeira Tarefa',
        description: 'Complete sua primeira tarefa',
        icon: '✅',
        points: 10,
        category: 'tasks'
      },
      taskMaster: {
        id: 'task-master',
        name: 'Mestre das Tarefas',
        description: 'Complete 100 tarefas',
        icon: '🏆',
        points: 100,
        category: 'tasks'
      },
      priorityFocus: {
        id: 'priority-focus',
        name: 'Foco nas Prioridades',
        description: 'Complete 10 tarefas de prioridade',
        icon: '🎯',
        points: 50,
        category: 'tasks'
      },

      // Badges de Pomodoro
      firstPomodoro: {
        id: 'first-pomodoro',
        name: 'Primeiro Pomodoro',
        description: 'Complete sua primeira sessão Pomodoro',
        icon: '🍅',
        points: 15,
        category: 'pomodoro'
      },
      pomodoroWarrior: {
        id: 'pomodoro-warrior',
        name: 'Guerreiro Pomodoro',
        description: 'Complete 50 sessões Pomodoro',
        icon: '⚔️',
        points: 75,
        category: 'pomodoro'
      },
      focusZone: {
        id: 'focus-zone',
        name: 'Zona de Foco',
        description: 'Mantenha foco por 25 horas',
        icon: '🧘',
        points: 100,
        category: 'pomodoro'
      },

      // Badges de Estudo
      firstVideo: {
        id: 'first-video',
        name: 'Primeiro Estudo',
        description: 'Assista seu primeiro vídeo',
        icon: '📚',
        points: 10,
        category: 'study'
      },
      knowledgeSeeker: {
        id: 'knowledge-seeker',
        name: 'Buscador do Conhecimento',
        description: 'Assista 25 vídeos',
        icon: '🔍',
        points: 60,
        category: 'study'
      },
      scholar: {
        id: 'scholar',
        name: 'Erudito',
        description: 'Acumule 50 horas de estudo',
        icon: '🎓',
        points: 120,
        category: 'study'
      },

      // Badges de TELOS
      firstReflection: {
        id: 'first-reflection',
        name: 'Primeira Reflexão',
        description: 'Complete sua primeira revisão TELOS',
        icon: '🤔',
        points: 20,
        category: 'telos'
      },
      philosopher: {
        id: 'philosopher',
        name: 'Filósofo',
        description: 'Complete 30 revisões TELOS',
        icon: '🧠',
        points: 80,
        category: 'telos'
      },
      wisdomKeeper: {
        id: 'wisdom-keeper',
        name: 'Guardião da Sabedoria',
        description: 'Complete revisões TELOS por 30 dias consecutivos',
        icon: '🦉',
        points: 150,
        category: 'telos'
      },

      // Badges de Streaks
      weekWarrior: {
        id: 'week-warrior',
        name: 'Guerreiro da Semana',
        description: 'Mantenha atividade por 7 dias consecutivos',
        icon: '🔥',
        points: 40,
        category: 'streaks'
      },
      monthMaster: {
        id: 'month-master',
        name: 'Mestre do Mês',
        description: 'Mantenha atividade por 30 dias consecutivos',
        icon: '🌟',
        points: 120,
        category: 'streaks'
      },
      yearLegend: {
        id: 'year-legend',
        name: 'Lenda do Ano',
        description: 'Mantenha atividade por 365 dias consecutivos',
        icon: '👑',
        points: 500,
        category: 'streaks'
      },

      // Badges Especiais
      earlyBird: {
        id: 'early-bird',
        name: 'Madrugador',
        description: 'Complete 10 Pomodoros antes das 8h',
        icon: '🌅',
        points: 50,
        category: 'special'
      },
      nightOwl: {
        id: 'night-owl',
        name: 'Coruja Noturna',
        description: 'Complete 10 Pomodoros após 22h',
        icon: '🦉',
        points: 50,
        category: 'special'
      },
      perfectDay: {
        id: 'perfect-day',
        name: 'Dia Perfeito',
        description: 'Complete todas as atividades em um dia',
        icon: '💎',
        points: 100,
        category: 'special'
      },
      productivity100: {
        id: 'productivity-100',
        name: 'Produtividade 100%',
        description: 'Alcance 100% de produtividade por 7 dias',
        icon: '💯',
        points: 200,
        category: 'special'
      }
    }
  }

  // Adicionar pontos de experiência
  addExperience(points, activity) {
    this.userStats.experience += points
    this.userStats.totalPoints += points
    
    // Verificar se subiu de nível
    const newLevel = this.calculateLevel(this.userStats.experience)
    if (newLevel > this.userStats.level) {
      this.levelUp(newLevel)
    }
    
    this.saveUserStats()
    this.checkAchievements(activity, points)
    
    return {
      pointsEarned: points,
      totalPoints: this.userStats.totalPoints,
      level: this.userStats.level,
      leveledUp: newLevel > this.userStats.level
    }
  }

  calculateLevel(experience) {
    for (let i = this.levels.length - 1; i >= 0; i--) {
      if (experience >= this.levels[i].minXP) {
        return this.levels[i].level
      }
    }
    return 1
  }

  levelUp(newLevel) {
    const oldLevel = this.userStats.level
    this.userStats.level = newLevel
    
    // Notificar level up
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('🎉 Level Up!', {
        body: `Parabéns! Você alcançou o nível ${newLevel}!`,
        icon: '/favicon.ico'
      })
    }
    
    // Adicionar conquista de level up
    this.unlockAchievement({
      id: `level-${newLevel}`,
      name: `Nível ${newLevel}`,
      description: `Alcançou o nível ${newLevel}`,
      icon: '⭐',
      points: newLevel * 10,
      category: 'levels',
      unlockedAt: new Date().toISOString()
    })
    
    return { oldLevel, newLevel }
  }

  // Registrar atividade
  recordActivity(type, data = {}) {
    const today = new Date().toDateString()
    
    switch (type) {
      case 'task_completed':
        this.userStats.tasksCompleted++
        this.addExperience(10, 'task')
        this.updateStreak('daily', today)
        break
        
      case 'pomodoro_completed':
        this.userStats.pomodorosCompleted++
        this.addExperience(15, 'pomodoro')
        this.updateStreak('pomodoro', today)
        break
        
      case 'video_watched':
        this.userStats.studyHours += data.duration || 1
        this.addExperience(20, 'study')
        this.updateStreak('study', today)
        break
        
      case 'telos_completed':
        this.userStats.telosReviews++
        this.addExperience(25, 'telos')
        this.updateStreak('telos', today)
        break
        
      case 'note_created':
        this.userStats.notesCreated++
        this.addExperience(5, 'note')
        break
        
      case 'focus_session':
        this.userStats.focusHours += data.duration || 0.5
        this.addExperience(data.focusScore || 10, 'focus')
        break
    }
    
    this.saveUserStats()
  }

  updateStreak(type, date) {
    const streak = this.streaks[type]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toDateString()
    
    if (!streak.lastDate) {
      // Primeira atividade
      streak.count = 1
      streak.lastDate = date
    } else if (streak.lastDate === date) {
      // Já fez hoje, não alterar
      return
    } else if (streak.lastDate === yesterdayStr) {
      // Continuou a sequência
      streak.count++
      streak.lastDate = date
    } else {
      // Quebrou a sequência
      streak.count = 1
      streak.lastDate = date
    }
    
    // Atualizar maior sequência
    if (type === 'daily' && streak.count > this.userStats.longestStreak) {
      this.userStats.longestStreak = streak.count
      this.userStats.currentStreak = streak.count
    }
    
    this.saveStreaks()
    this.checkStreakAchievements(type, streak.count)
  }

  checkStreakAchievements(type, count) {
    const streakBadges = {
      7: 'weekWarrior',
      30: 'monthMaster',
      365: 'yearLegend'
    }
    
    if (streakBadges[count]) {
      this.unlockAchievement(this.badges[streakBadges[count]])
    }
  }

  checkAchievements(activity, points) {
    const stats = this.userStats
    
    // Verificar conquistas baseadas em contadores
    const achievementChecks = {
      'first-task': () => stats.tasksCompleted === 1,
      'task-master': () => stats.tasksCompleted === 100,
      'priority-focus': () => this.getPriorityTasksCompleted() === 10,
      'first-pomodoro': () => stats.pomodorosCompleted === 1,
      'pomodoro-warrior': () => stats.pomodorosCompleted === 50,
      'focus-zone': () => stats.focusHours >= 25,
      'first-video': () => this.getVideosWatched() === 1,
      'knowledge-seeker': () => this.getVideosWatched() === 25,
      'scholar': () => stats.studyHours >= 50,
      'first-reflection': () => stats.telosReviews === 1,
      'philosopher': () => stats.telosReviews === 30,
      'perfect-day': () => this.checkPerfectDay()
    }
    
    Object.entries(achievementChecks).forEach(([badgeId, checkFn]) => {
      if (checkFn() && !this.hasAchievement(badgeId)) {
        this.unlockAchievement(this.badges[badgeId])
      }
    })
  }

  checkDailyAchievements() {
    // Verificar conquistas que dependem de horário
    const now = new Date()
    const hour = now.getHours()
    
    if (hour < 8 && this.userStats.pomodorosCompleted > 0) {
      this.checkEarlyBirdProgress()
    }
    
    if (hour >= 22 && this.userStats.pomodorosCompleted > 0) {
      this.checkNightOwlProgress()
    }
  }

  checkEarlyBirdProgress() {
    const progress = JSON.parse(localStorage.getItem('lex-flow-early-bird-progress') || '0')
    const newProgress = progress + 1
    localStorage.setItem('lex-flow-early-bird-progress', JSON.stringify(newProgress))
    
    if (newProgress >= 10 && !this.hasAchievement('early-bird')) {
      this.unlockAchievement(this.badges.earlyBird)
    }
  }

  checkNightOwlProgress() {
    const progress = JSON.parse(localStorage.getItem('lex-flow-night-owl-progress') || '0')
    const newProgress = progress + 1
    localStorage.setItem('lex-flow-night-owl-progress', JSON.stringify(newProgress))
    
    if (newProgress >= 10 && !this.hasAchievement('night-owl')) {
      this.unlockAchievement(this.badges.nightOwl)
    }
  }

  checkPerfectDay() {
    const today = new Date().toDateString()
    const todayStats = this.getTodayStats()
    
    return todayStats.tasks > 0 && 
           todayStats.pomodoros > 0 && 
           todayStats.study > 0 && 
           todayStats.telos > 0
  }

  getTodayStats() {
    // Em uma implementação real, isso buscaria dados específicos do dia
    return {
      tasks: 1,
      pomodoros: 1,
      study: 1,
      telos: 1
    }
  }

  getPriorityTasksCompleted() {
    const tasks = JSON.parse(localStorage.getItem('lex-flow-tasks') || '[]')
    return tasks.filter(task => task.completed && task.priority).length
  }

  getVideosWatched() {
    const videos = JSON.parse(localStorage.getItem('lex-flow-videos') || '[]')
    return videos.filter(video => video.watched).length
  }

  unlockAchievement(badge) {
    if (this.hasAchievement(badge.id)) return false
    
    const achievement = {
      ...badge,
      unlockedAt: new Date().toISOString()
    }
    
    this.achievements.push(achievement)
    this.saveAchievements()
    
    // Adicionar pontos da conquista
    this.userStats.totalPoints += badge.points
    this.userStats.experience += badge.points
    this.saveUserStats()
    
    // Notificar conquista
    this.notifyAchievement(achievement)
    
    return true
  }

  notifyAchievement(achievement) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`🏆 Conquista Desbloqueada!`, {
        body: `${achievement.icon} ${achievement.name}: ${achievement.description}`,
        icon: '/favicon.ico'
      })
    }
    
    // Mostrar toast ou modal no app
    this.showAchievementToast(achievement)
  }

  showAchievementToast(achievement) {
    // Criar elemento de toast
    const toast = document.createElement('div')
    toast.className = 'achievement-toast'
    toast.innerHTML = `
      <div class="achievement-content">
        <div class="achievement-icon">${achievement.icon}</div>
        <div class="achievement-text">
          <div class="achievement-title">Conquista Desbloqueada!</div>
          <div class="achievement-name">${achievement.name}</div>
          <div class="achievement-points">+${achievement.points} pontos</div>
        </div>
      </div>
    `
    
    // Adicionar estilos
    toast.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #fbbf24, #f59e0b);
      color: white;
      padding: 16px;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0,0,0,0.2);
      z-index: 10000;
      animation: slideIn 0.5s ease-out;
      max-width: 300px;
    `
    
    document.body.appendChild(toast)
    
    // Remover após 5 segundos
    setTimeout(() => {
      toast.style.animation = 'slideOut 0.5s ease-in'
      setTimeout(() => {
        document.body.removeChild(toast)
      }, 500)
    }, 5000)
  }

  hasAchievement(badgeId) {
    return this.achievements.some(achievement => achievement.id === badgeId)
  }

  getAchievementsByCategory(category) {
    return this.achievements.filter(achievement => achievement.category === category)
  }

  getProgress() {
    const currentLevel = this.levels.find(level => level.level === this.userStats.level)
    const nextLevel = this.levels.find(level => level.level === this.userStats.level + 1)
    
    const progressInLevel = nextLevel 
      ? ((this.userStats.experience - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
      : 100
    
    return {
      level: this.userStats.level,
      levelName: currentLevel?.name || 'Iniciante',
      experience: this.userStats.experience,
      totalPoints: this.userStats.totalPoints,
      progressInLevel: Math.round(progressInLevel),
      nextLevelXP: nextLevel?.minXP || null,
      achievements: this.achievements.length,
      currentStreak: this.userStats.currentStreak,
      longestStreak: this.userStats.longestStreak
    }
  }

  getLeaderboard() {
    // Em uma implementação real, isso viria de um servidor
    // Por enquanto, retornamos dados simulados
    return [
      { name: 'Você', points: this.userStats.totalPoints, level: this.userStats.level, rank: 1 },
      { name: 'Ana Silva', points: 2500, level: 6, rank: 2 },
      { name: 'João Santos', points: 2200, level: 5, rank: 3 },
      { name: 'Maria Costa', points: 1800, level: 5, rank: 4 },
      { name: 'Pedro Lima', points: 1500, level: 4, rank: 5 }
    ].sort((a, b) => b.points - a.points)
  }

  exportGamificationData() {
    const data = {
      userStats: this.userStats,
      achievements: this.achievements,
      streaks: this.streaks,
      progress: this.getProgress(),
      exportedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `lex-flow-gamification-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  resetProgress() {
    if (confirm('Tem certeza que deseja resetar todo o progresso? Esta ação não pode ser desfeita.')) {
      localStorage.removeItem('lex-flow-achievements')
      localStorage.removeItem('lex-flow-user-stats')
      localStorage.removeItem('lex-flow-streaks')
      localStorage.removeItem('lex-flow-early-bird-progress')
      localStorage.removeItem('lex-flow-night-owl-progress')
      
      this.achievements = []
      this.userStats = this.loadUserStats()
      this.streaks = this.loadStreaks()
      
      return true
    }
    return false
  }
}

// Instância global
export const gamificationManager = new GamificationManager()

// Funções de conveniência
export const recordActivity = (type, data) => gamificationManager.recordActivity(type, data)
export const getProgress = () => gamificationManager.getProgress()
export const getAchievements = () => gamificationManager.achievements
export const getLeaderboard = () => gamificationManager.getLeaderboard()
export const exportGamificationData = () => gamificationManager.exportGamificationData()
export const addExperience = (points, activity) => gamificationManager.addExperience(points, activity)

