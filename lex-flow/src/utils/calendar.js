// Sistema de Integração com Calendário do Lex Flow

class CalendarManager {
  constructor() {
    this.events = this.loadEvents()
    this.syncEnabled = false
    this.lastSync = null
  }

  loadEvents() {
    return JSON.parse(localStorage.getItem('lex-flow-calendar-events') || '[]')
  }

  saveEvents() {
    localStorage.setItem('lex-flow-calendar-events', JSON.stringify(this.events))
  }

  // Criar evento no calendário
  createEvent(title, description, startTime, endTime, type = 'task') {
    const event = {
      id: Date.now(),
      title: title.trim(),
      description: description.trim(),
      startTime: new Date(startTime).toISOString(),
      endTime: new Date(endTime).toISOString(),
      type, // 'task', 'pomodoro', 'study', 'break', 'telos'
      completed: false,
      createdAt: new Date().toISOString(),
      source: 'lex-flow'
    }

    this.events.push(event)
    this.saveEvents()
    return event
  }

  // Criar evento de Pomodoro
  createPomodoroEvent(sessionType = 'work', duration = 25) {
    const now = new Date()
    const endTime = new Date(now.getTime() + duration * 60000)
    
    const title = sessionType === 'work' ? '🍅 Sessão Pomodoro' : '☕ Intervalo Pomodoro'
    const description = sessionType === 'work' 
      ? `Sessão de trabalho focado de ${duration} minutos`
      : `Intervalo de ${duration} minutos`

    return this.createEvent(title, description, now, endTime, 'pomodoro')
  }

  // Criar evento de tarefa
  createTaskEvent(task, scheduledTime) {
    const startTime = new Date(scheduledTime)
    const endTime = new Date(startTime.getTime() + 60 * 60000) // 1 hora por padrão
    
    const title = `📋 ${task.title}`
    const description = `Tarefa da categoria: ${task.category}`

    return this.createEvent(title, description, startTime, endTime, 'task')
  }

  // Criar evento de estudo
  createStudyEvent(video, scheduledTime) {
    const startTime = new Date(scheduledTime)
    const endTime = new Date(startTime.getTime() + 90 * 60000) // 1.5 horas por padrão
    
    const title = `📚 ${video.title}`
    const description = `Assistir vídeo de estudo: ${video.url}`

    return this.createEvent(title, description, startTime, endTime, 'study')
  }

  // Criar evento de revisão TELOS
  createTelosEvent(scheduledTime) {
    const startTime = new Date(scheduledTime)
    const endTime = new Date(startTime.getTime() + 30 * 60000) // 30 minutos
    
    const title = '🎯 Revisão TELOS'
    const description = 'Reflexão diária sobre valores, visão e propósito'

    return this.createEvent(title, description, startTime, endTime, 'telos')
  }

  // Obter eventos do dia
  getTodaysEvents() {
    const today = new Date()
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1)

    return this.events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate >= startOfDay && eventDate < endOfDay
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  }

  // Obter eventos da semana
  getWeekEvents() {
    const today = new Date()
    const startOfWeek = new Date(today)
    startOfWeek.setDate(today.getDate() - today.getDay())
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    return this.events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate >= startOfWeek && eventDate < endOfWeek
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
  }

  // Obter próximos eventos
  getUpcomingEvents(limit = 5) {
    const now = new Date()
    return this.events
      .filter(event => new Date(event.startTime) > now && !event.completed)
      .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
      .slice(0, limit)
  }

  // Marcar evento como concluído
  completeEvent(eventId) {
    const event = this.events.find(e => e.id === eventId)
    if (event) {
      event.completed = true
      event.completedAt = new Date().toISOString()
      this.saveEvents()
    }
    return event
  }

  // Atualizar evento
  updateEvent(eventId, updates) {
    const eventIndex = this.events.findIndex(e => e.id === eventId)
    if (eventIndex !== -1) {
      this.events[eventIndex] = { ...this.events[eventIndex], ...updates }
      this.saveEvents()
      return this.events[eventIndex]
    }
    return null
  }

  // Deletar evento
  deleteEvent(eventId) {
    this.events = this.events.filter(e => e.id !== eventId)
    this.saveEvents()
  }

  // Gerar arquivo .ics para importar em calendários externos
  generateICSFile(events = null) {
    const eventsToExport = events || this.events
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lex Flow//Lex Flow Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH'
    ]

    eventsToExport.forEach(event => {
      const startDate = new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      const endDate = new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
      const createdDate = new Date(event.createdAt).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${event.id}@lexflow.app`,
        `DTSTAMP:${createdDate}`,
        `DTSTART:${startDate}`,
        `DTEND:${endDate}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description}`,
        `CATEGORIES:${event.type.toUpperCase()}`,
        `STATUS:${event.completed ? 'COMPLETED' : 'CONFIRMED'}`,
        'END:VEVENT'
      )
    })

    icsContent.push('END:VCALENDAR')
    return icsContent.join('\r\n')
  }

  // Exportar calendário
  exportCalendar(events = null) {
    const icsContent = this.generateICSFile(events)
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `lex-flow-calendar-${new Date().toISOString().split('T')[0]}.ics`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Criar URL para Google Calendar
  createGoogleCalendarURL(event) {
    const baseURL = 'https://calendar.google.com/calendar/render?action=TEMPLATE'
    const params = new URLSearchParams({
      text: event.title,
      dates: `${new Date(event.startTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${new Date(event.endTime).toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      details: event.description,
      location: 'Lex Flow App'
    })
    
    return `${baseURL}&${params.toString()}`
  }

  // Criar URL para Outlook
  createOutlookURL(event) {
    const baseURL = 'https://outlook.live.com/calendar/0/deeplink/compose'
    const params = new URLSearchParams({
      subject: event.title,
      startdt: new Date(event.startTime).toISOString(),
      enddt: new Date(event.endTime).toISOString(),
      body: event.description,
      location: 'Lex Flow App'
    })
    
    return `${baseURL}?${params.toString()}`
  }

  // Obter estatísticas do calendário
  getCalendarStats() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const thisWeek = new Date(today)
    thisWeek.setDate(today.getDate() - today.getDay())

    return {
      totalEvents: this.events.length,
      completedEvents: this.events.filter(e => e.completed).length,
      todaysEvents: this.getTodaysEvents().length,
      upcomingEvents: this.getUpcomingEvents().length,
      eventsByType: this.events.reduce((acc, event) => {
        acc[event.type] = (acc[event.type] || 0) + 1
        return acc
      }, {}),
      completionRate: this.events.length > 0 
        ? Math.round((this.events.filter(e => e.completed).length / this.events.length) * 100)
        : 0
    }
  }

  // Sugerir horários livres
  suggestFreeSlots(date, duration = 60) {
    const targetDate = new Date(date)
    const dayEvents = this.events.filter(event => {
      const eventDate = new Date(event.startTime)
      return eventDate.toDateString() === targetDate.toDateString()
    }).sort((a, b) => new Date(a.startTime) - new Date(b.startTime))

    const freeSlots = []
    const workStart = new Date(targetDate)
    workStart.setHours(9, 0, 0, 0) // 9:00 AM
    const workEnd = new Date(targetDate)
    workEnd.setHours(18, 0, 0, 0) // 6:00 PM

    let currentTime = new Date(workStart)

    dayEvents.forEach(event => {
      const eventStart = new Date(event.startTime)
      const eventEnd = new Date(event.endTime)

      // Verificar se há tempo livre antes do evento
      if (eventStart - currentTime >= duration * 60000) {
        freeSlots.push({
          start: new Date(currentTime),
          end: new Date(eventStart),
          duration: Math.floor((eventStart - currentTime) / 60000)
        })
      }

      currentTime = new Date(Math.max(currentTime, eventEnd))
    })

    // Verificar tempo livre após o último evento
    if (workEnd - currentTime >= duration * 60000) {
      freeSlots.push({
        start: new Date(currentTime),
        end: new Date(workEnd),
        duration: Math.floor((workEnd - currentTime) / 60000)
      })
    }

    return freeSlots.filter(slot => slot.duration >= duration)
  }

  // Configurar lembretes automáticos
  setupReminders() {
    const upcomingEvents = this.getUpcomingEvents(10)
    
    upcomingEvents.forEach(event => {
      const eventTime = new Date(event.startTime)
      const reminderTime = new Date(eventTime.getTime() - 15 * 60000) // 15 minutos antes
      const now = new Date()

      if (reminderTime > now) {
        const timeUntilReminder = reminderTime.getTime() - now.getTime()
        
        setTimeout(() => {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`📅 Lembrete: ${event.title}`, {
              body: `Evento começará em 15 minutos: ${event.description}`,
              icon: '/favicon.ico'
            })
          }
        }, timeUntilReminder)
      }
    })
  }
}

// Instância global
export const calendarManager = new CalendarManager()

// Funções de conveniência
export const createCalendarEvent = (title, description, startTime, endTime, type) => 
  calendarManager.createEvent(title, description, startTime, endTime, type)
export const createPomodoroEvent = (sessionType, duration) => 
  calendarManager.createPomodoroEvent(sessionType, duration)
export const getTodaysEvents = () => calendarManager.getTodaysEvents()
export const getUpcomingEvents = (limit) => calendarManager.getUpcomingEvents(limit)
export const exportCalendar = (events) => calendarManager.exportCalendar(events)
export const getCalendarStats = () => calendarManager.getCalendarStats()
export const suggestFreeSlots = (date, duration) => calendarManager.suggestFreeSlots(date, duration)

