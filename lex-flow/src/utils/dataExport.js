// Sistema Completo de Exportação de Dados do Lex Flow

import { cloudSync } from './cloudSync.js'
import { calendarManager } from './calendar.js'
import { quoteManager } from './quotes.js'
import { focusModeManager } from './focusMode.js'

class DataExportManager {
  constructor() {
    this.exportFormats = ['json', 'csv', 'markdown', 'pdf', 'ics']
    this.dataTypes = [
      'tasks',
      'priorities', 
      'videos',
      'notes',
      'telosReviews',
      'pomodoroStats',
      'focusSessions',
      'calendarEvents',
      'quotes',
      'settings',
      'analytics'
    ]
  }

  // Coletar todos os dados do aplicativo
  collectAllData() {
    return {
      metadata: {
        exportedAt: new Date().toISOString(),
        version: '2.0.0',
        source: 'Lex Flow',
        user: this.getUserInfo()
      },
      tasks: JSON.parse(localStorage.getItem('lex-flow-tasks') || '[]'),
      priorities: JSON.parse(localStorage.getItem('lex-flow-priorities') || '[]'),
      videos: JSON.parse(localStorage.getItem('lex-flow-videos') || '[]'),
      notes: JSON.parse(localStorage.getItem('lex-flow-notes') || '[]'),
      telosReviews: JSON.parse(localStorage.getItem('lex-flow-telos-reviews') || '[]'),
      pomodoroStats: JSON.parse(localStorage.getItem('lex-flow-pomodoro-stats') || '{}'),
      pomodoroSettings: JSON.parse(localStorage.getItem('lex-flow-pomodoro-settings') || '{}'),
      focusSessions: JSON.parse(localStorage.getItem('lex-flow-focus-sessions') || '[]'),
      focusSettings: JSON.parse(localStorage.getItem('lex-flow-focus-settings') || '{}'),
      calendarEvents: JSON.parse(localStorage.getItem('lex-flow-calendar-events') || '[]'),
      customQuotes: JSON.parse(localStorage.getItem('lex-flow-custom-quotes') || '[]'),
      favoriteQuotes: JSON.parse(localStorage.getItem('lex-flow-favorite-quotes') || '[]'),
      theme: localStorage.getItem('lex-flow-theme') || 'light',
      gamification: JSON.parse(localStorage.getItem('lex-flow-gamification') || '{}'),
      syncSettings: JSON.parse(localStorage.getItem('lex-flow-sync-settings') || '{}'),
      analytics: this.generateAnalyticsSummary()
    }
  }

  getUserInfo() {
    return {
      deviceId: localStorage.getItem('lex-flow-device-id') || 'unknown',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      platform: navigator.platform
    }
  }

  generateAnalyticsSummary() {
    const data = this.collectAllData()
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    return {
      totalTasks: data.tasks.length,
      completedTasks: data.tasks.filter(t => t.completed).length,
      totalVideos: data.videos.length,
      watchedVideos: data.videos.filter(v => v.watched).length,
      totalNotes: data.notes.length,
      totalTelosReviews: data.telosReviews.length,
      totalFocusSessions: data.focusSessions.length,
      totalFocusTime: data.focusSessions.reduce((sum, s) => sum + (s.actualDuration || 0), 0),
      averageFocusScore: data.focusSessions.length > 0 
        ? Math.round(data.focusSessions.reduce((sum, s) => sum + (s.focusScore || 0), 0) / data.focusSessions.length)
        : 0,
      recentActivity: {
        tasksLast30Days: data.tasks.filter(t => new Date(t.createdAt || t.addedAt) >= thirtyDaysAgo).length,
        videosLast30Days: data.videos.filter(v => new Date(v.addedAt) >= thirtyDaysAgo).length,
        notesLast30Days: data.notes.filter(n => new Date(n.createdAt) >= thirtyDaysAgo).length,
        focusSessionsLast30Days: data.focusSessions.filter(s => new Date(s.startTime) >= thirtyDaysAgo).length
      }
    }
  }

  // Exportar em formato JSON
  exportAsJSON(dataTypes = null, filename = null) {
    const data = this.collectAllData()
    const exportData = dataTypes ? this.filterDataTypes(data, dataTypes) : data
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    this.downloadFile(blob, filename || `lex-flow-export-${this.getDateString()}.json`)
    
    return exportData
  }

  // Exportar em formato CSV
  exportAsCSV(dataType, filename = null) {
    const data = this.collectAllData()
    let csvContent = ''
    
    switch (dataType) {
      case 'tasks':
        csvContent = this.convertTasksToCSV(data.tasks)
        break
      case 'videos':
        csvContent = this.convertVideosToCSV(data.videos)
        break
      case 'notes':
        csvContent = this.convertNotesToCSV(data.notes)
        break
      case 'telosReviews':
        csvContent = this.convertTelosToCSV(data.telosReviews)
        break
      case 'focusSessions':
        csvContent = this.convertFocusSessionsToCSV(data.focusSessions)
        break
      default:
        throw new Error(`Tipo de dados não suportado para CSV: ${dataType}`)
    }
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
    this.downloadFile(blob, filename || `lex-flow-${dataType}-${this.getDateString()}.csv`)
    
    return csvContent
  }

  // Exportar em formato Markdown
  exportAsMarkdown(filename = null) {
    const data = this.collectAllData()
    const markdown = this.convertToMarkdown(data)
    
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    this.downloadFile(blob, filename || `lex-flow-export-${this.getDateString()}.md`)
    
    return markdown
  }

  // Exportar calendário em formato ICS
  exportCalendarAsICS(filename = null) {
    const icsContent = calendarManager.generateICSFile()
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    this.downloadFile(blob, filename || `lex-flow-calendar-${this.getDateString()}.ics`)
    
    return icsContent
  }

  // Converter tarefas para CSV
  convertTasksToCSV(tasks) {
    const headers = ['ID', 'Título', 'Categoria', 'Concluída', 'Prioridade', 'Data de Criação', 'Data de Conclusão']
    const rows = tasks.map(task => [
      task.id || '',
      `"${task.title || ''}"`,
      task.category || '',
      task.completed ? 'Sim' : 'Não',
      task.priority ? 'Sim' : 'Não',
      task.createdAt || task.addedAt || '',
      task.completedAt || ''
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  // Converter vídeos para CSV
  convertVideosToCSV(videos) {
    const headers = ['ID', 'Título', 'URL', 'Assistido', 'Canal', 'Data de Adição', 'Anotações']
    const rows = videos.map(video => [
      video.id || '',
      `"${video.title || ''}"`,
      video.url || '',
      video.watched ? 'Sim' : 'Não',
      video.summary?.author || '',
      video.addedAt || '',
      `"${video.notes || ''}"`
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  // Converter anotações para CSV
  convertNotesToCSV(notes) {
    const headers = ['ID', 'Conteúdo', 'Categoria', 'Tags', 'Data de Criação']
    const rows = notes.map(note => [
      note.id || '',
      `"${note.content || ''}"`,
      note.category || '',
      `"${note.tags?.join(', ') || ''}"`,
      note.createdAt || ''
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  // Converter revisões TELOS para CSV
  convertTelosToCSV(reviews) {
    const headers = ['Data', 'Visão', 'Propósito', 'Aprendizado', 'Obstáculos', 'Valores', 'Progresso']
    const rows = reviews.map(review => [
      review.date || '',
      `"${review.vision || ''}"`,
      `"${review.purpose || ''}"`,
      `"${review.learning || ''}"`,
      `"${review.obstacles || ''}"`,
      `"${review.values || ''}"`,
      review.progress || ''
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  // Converter sessões de foco para CSV
  convertFocusSessionsToCSV(sessions) {
    const headers = ['ID', 'Data de Início', 'Duração Planejada', 'Duração Real', 'Tarefa', 'Concluída', 'Score de Foco', 'Distrações']
    const rows = sessions.map(session => [
      session.id || '',
      session.startTime || '',
      session.plannedDuration || '',
      session.actualDuration || '',
      `"${session.task || ''}"`,
      session.completed ? 'Sim' : 'Não',
      session.focusScore || '',
      session.distractions?.length || 0
    ])
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  }

  // Converter dados para Markdown
  convertToMarkdown(data) {
    let markdown = `# Lex Flow - Exportação de Dados\n\n`
    markdown += `**Data da Exportação:** ${new Date(data.metadata.exportedAt).toLocaleString('pt-BR')}\n\n`
    
    // Resumo Analítico
    markdown += `## 📊 Resumo Analítico\n\n`
    markdown += `- **Total de Tarefas:** ${data.analytics.totalTasks}\n`
    markdown += `- **Tarefas Concluídas:** ${data.analytics.completedTasks}\n`
    markdown += `- **Total de Vídeos:** ${data.analytics.totalVideos}\n`
    markdown += `- **Vídeos Assistidos:** ${data.analytics.watchedVideos}\n`
    markdown += `- **Total de Anotações:** ${data.analytics.totalNotes}\n`
    markdown += `- **Revisões TELOS:** ${data.analytics.totalTelosReviews}\n`
    markdown += `- **Sessões de Foco:** ${data.analytics.totalFocusSessions}\n`
    markdown += `- **Tempo Total de Foco:** ${Math.round(data.analytics.totalFocusTime / 60)} horas\n\n`

    // Tarefas
    if (data.tasks.length > 0) {
      markdown += `## ✅ Tarefas\n\n`
      data.tasks.forEach(task => {
        const status = task.completed ? '✅' : '⏳'
        markdown += `${status} **${task.title}** (${task.category})\n`
        if (task.createdAt) {
          markdown += `   - Criada em: ${new Date(task.createdAt).toLocaleDateString('pt-BR')}\n`
        }
        if (task.completed && task.completedAt) {
          markdown += `   - Concluída em: ${new Date(task.completedAt).toLocaleDateString('pt-BR')}\n`
        }
        markdown += `\n`
      })
    }

    // Vídeos de Estudo
    if (data.videos.length > 0) {
      markdown += `## 📚 Vídeos de Estudo\n\n`
      data.videos.forEach(video => {
        const status = video.watched ? '✅' : '⏳'
        markdown += `${status} **${video.title}**\n`
        markdown += `   - URL: ${video.url}\n`
        if (video.summary?.author) {
          markdown += `   - Canal: ${video.summary.author}\n`
        }
        if (video.notes) {
          markdown += `   - Anotações: ${video.notes}\n`
        }
        markdown += `\n`
      })
    }

    // Anotações
    if (data.notes.length > 0) {
      markdown += `## 📝 Anotações\n\n`
      data.notes.forEach(note => {
        markdown += `### ${note.category || 'Geral'}\n`
        markdown += `${note.content}\n`
        if (note.tags && note.tags.length > 0) {
          markdown += `*Tags: ${note.tags.join(', ')}*\n`
        }
        if (note.createdAt) {
          markdown += `*Criada em: ${new Date(note.createdAt).toLocaleDateString('pt-BR')}*\n`
        }
        markdown += `\n`
      })
    }

    // Revisões TELOS
    if (data.telosReviews.length > 0) {
      markdown += `## 🎯 Revisões TELOS\n\n`
      data.telosReviews.forEach(review => {
        markdown += `### ${new Date(review.date).toLocaleDateString('pt-BR')}\n\n`
        if (review.vision) markdown += `**Visão:** ${review.vision}\n\n`
        if (review.purpose) markdown += `**Propósito:** ${review.purpose}\n\n`
        if (review.learning) markdown += `**Aprendizado:** ${review.learning}\n\n`
        if (review.obstacles) markdown += `**Obstáculos:** ${review.obstacles}\n\n`
        if (review.values) markdown += `**Valores:** ${review.values}\n\n`
        markdown += `---\n\n`
      })
    }

    return markdown
  }

  // Filtrar tipos de dados específicos
  filterDataTypes(data, dataTypes) {
    const filtered = { metadata: data.metadata }
    
    dataTypes.forEach(type => {
      if (data[type] !== undefined) {
        filtered[type] = data[type]
      }
    })
    
    return filtered
  }

  // Importar dados de backup
  async importData(file) {
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      if (!this.validateImportData(data)) {
        return { success: false, error: 'Arquivo de backup inválido' }
      }
      
      // Fazer backup dos dados atuais antes de importar
      const currentData = this.collectAllData()
      localStorage.setItem('lex-flow-backup-before-import', JSON.stringify(currentData))
      
      // Importar dados
      this.restoreData(data)
      
      return { 
        success: true, 
        message: 'Dados importados com sucesso',
        imported: Object.keys(data).filter(key => key !== 'metadata').length
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error)
      return { success: false, error: 'Erro ao processar arquivo' }
    }
  }

  // Validar dados de importação
  validateImportData(data) {
    return data && 
           typeof data === 'object' && 
           data.metadata && 
           data.metadata.source === 'Lex Flow'
  }

  // Restaurar dados importados
  restoreData(data) {
    const dataMap = {
      'tasks': 'lex-flow-tasks',
      'priorities': 'lex-flow-priorities',
      'videos': 'lex-flow-videos',
      'notes': 'lex-flow-notes',
      'telosReviews': 'lex-flow-telos-reviews',
      'pomodoroStats': 'lex-flow-pomodoro-stats',
      'pomodoroSettings': 'lex-flow-pomodoro-settings',
      'focusSessions': 'lex-flow-focus-sessions',
      'focusSettings': 'lex-flow-focus-settings',
      'calendarEvents': 'lex-flow-calendar-events',
      'customQuotes': 'lex-flow-custom-quotes',
      'favoriteQuotes': 'lex-flow-favorite-quotes',
      'gamification': 'lex-flow-gamification',
      'syncSettings': 'lex-flow-sync-settings'
    }
    
    Object.entries(dataMap).forEach(([dataKey, storageKey]) => {
      if (data[dataKey] !== undefined) {
        localStorage.setItem(storageKey, JSON.stringify(data[dataKey]))
      }
    })
    
    if (data.theme) {
      localStorage.setItem('lex-flow-theme', data.theme)
    }
  }

  // Utilitários
  getDateString() {
    return new Date().toISOString().split('T')[0]
  }

  downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Exportação automática programada
  scheduleAutoExport(frequency = 'weekly') {
    const intervals = {
      daily: 24 * 60 * 60 * 1000,
      weekly: 7 * 24 * 60 * 60 * 1000,
      monthly: 30 * 24 * 60 * 60 * 1000
    }
    
    const interval = intervals[frequency]
    if (!interval) return false
    
    setInterval(() => {
      this.exportAsJSON(null, `lex-flow-auto-backup-${this.getDateString()}.json`)
    }, interval)
    
    return true
  }

  // Obter estatísticas de exportação
  getExportStats() {
    const data = this.collectAllData()
    
    return {
      totalDataPoints: Object.values(data).reduce((sum, value) => {
        if (Array.isArray(value)) return sum + value.length
        if (typeof value === 'object' && value !== null) return sum + Object.keys(value).length
        return sum + 1
      }, 0),
      dataTypes: Object.keys(data).filter(key => key !== 'metadata').length,
      estimatedSize: JSON.stringify(data).length,
      lastExport: localStorage.getItem('lex-flow-last-export') || 'Nunca'
    }
  }
}

// Instância global
export const dataExportManager = new DataExportManager()

// Funções de conveniência
export const exportAllData = (format = 'json', filename = null) => {
  switch (format) {
    case 'json':
      return dataExportManager.exportAsJSON(null, filename)
    case 'markdown':
      return dataExportManager.exportAsMarkdown(filename)
    default:
      throw new Error(`Formato não suportado: ${format}`)
  }
}

export const exportDataType = (dataType, format = 'csv', filename = null) => {
  return dataExportManager.exportAsCSV(dataType, filename)
}

export const importData = (file) => dataExportManager.importData(file)
export const exportCalendar = (filename) => dataExportManager.exportCalendarAsICS(filename)
export const getExportStats = () => dataExportManager.getExportStats()
export const scheduleAutoExport = (frequency) => dataExportManager.scheduleAutoExport(frequency)

