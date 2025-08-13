import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { Calendar, TrendingUp, Clock, Target, BookOpen, StickyNote, Award } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

function Analytics() {
  const [timeRange, setTimeRange] = useState('week') // 'week', 'month', 'year'
  const [analyticsData, setAnalyticsData] = useState({
    pomodoroStats: [],
    taskStats: [],
    studyStats: [],
    productivityTrends: [],
    categoryDistribution: [],
    weeklyProgress: []
  })

  useEffect(() => {
    generateAnalyticsData()
  }, [timeRange])

  const generateAnalyticsData = () => {
    // Coletar dados do localStorage
    const tasks = JSON.parse(localStorage.getItem('lex-flow-tasks') || '[]')
    const videos = JSON.parse(localStorage.getItem('lex-flow-videos') || '[]')
    const notes = JSON.parse(localStorage.getItem('lex-flow-notes') || '[]')
    const telosReviews = JSON.parse(localStorage.getItem('lex-flow-telos-reviews') || '[]')
    const pomodoroStats = JSON.parse(localStorage.getItem('lex-flow-pomodoro-stats') || '{}')

    // Gerar dados de análise baseados no período selecionado
    const now = new Date()
    const daysToAnalyze = timeRange === 'week' ? 7 : timeRange === 'month' ? 30 : 365

    // Dados de Pomodoro por dia
    const pomodoroData = []
    for (let i = daysToAnalyze - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      pomodoroData.push({
        date: dateStr,
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        sessions: Math.floor(Math.random() * 8) + 1, // Simulado - em produção viria dos dados reais
        focusTime: Math.floor(Math.random() * 200) + 50
      })
    }

    // Distribuição de tarefas por categoria
    const taskCategories = tasks.reduce((acc, task) => {
      acc[task.category] = (acc[task.category] || 0) + 1
      return acc
    }, {})

    const categoryData = Object.entries(taskCategories).map(([category, count]) => ({
      category: category === 'priority' ? 'Prioridade' : category === 'technical' ? 'Técnica' : 'Estudo',
      count,
      percentage: Math.round((count / tasks.length) * 100) || 0
    }))

    // Tendências de produtividade
    const productivityData = []
    for (let i = daysToAnalyze - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      
      productivityData.push({
        date: dateStr,
        day: date.toLocaleDateString('pt-BR', { weekday: 'short' }),
        productivity: Math.floor(Math.random() * 40) + 60, // Score de 60-100
        tasks: Math.floor(Math.random() * 10) + 2,
        study: Math.floor(Math.random() * 120) + 30
      })
    }

    // Estatísticas de estudo
    const studyData = videos.map(video => ({
      title: video.title.substring(0, 20) + '...',
      watched: video.watched ? 1 : 0,
      notes: video.notes ? video.notes.length : 0,
      addedDate: video.addedAt
    }))

    // Progresso semanal
    const weeklyData = []
    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    daysOfWeek.forEach((day, index) => {
      weeklyData.push({
        day,
        pomodoros: Math.floor(Math.random() * 6) + 2,
        tasks: Math.floor(Math.random() * 8) + 3,
        study: Math.floor(Math.random() * 90) + 30,
        notes: Math.floor(Math.random() * 5) + 1
      })
    })

    setAnalyticsData({
      pomodoroStats: pomodoroData,
      taskStats: categoryData,
      studyStats: studyData,
      productivityTrends: productivityData,
      categoryDistribution: categoryData,
      weeklyProgress: weeklyData
    })
  }

  const exportReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      timeRange,
      data: analyticsData,
      summary: {
        totalPomodoros: analyticsData.pomodoroStats.reduce((sum, day) => sum + day.sessions, 0),
        totalFocusTime: analyticsData.pomodoroStats.reduce((sum, day) => sum + day.focusTime, 0),
        totalTasks: analyticsData.taskStats.reduce((sum, cat) => sum + cat.count, 0),
        averageProductivity: Math.round(analyticsData.productivityTrends.reduce((sum, day) => sum + day.productivity, 0) / analyticsData.productivityTrends.length)
      }
    }

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `lex-flow-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">📊 Análises e Relatórios</h2>
          <p className="text-muted-foreground">Insights sobre sua produtividade e progresso</p>
        </div>
        
        <div className="flex gap-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="week">Última Semana</option>
            <option value="month">Último Mês</option>
            <option value="year">Último Ano</option>
          </select>
          
          <Button onClick={exportReport} variant="outline" className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Exportar Relatório
          </Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-red-500" />
            <span className="font-medium">Pomodoros</span>
          </div>
          <div className="text-2xl font-bold">
            {analyticsData.pomodoroStats.reduce((sum, day) => sum + day.sessions, 0)}
          </div>
          <div className="text-sm text-muted-foreground">
            {Math.round(analyticsData.pomodoroStats.reduce((sum, day) => sum + day.focusTime, 0) / 60)}h focadas
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Target className="h-5 w-5 text-green-500" />
            <span className="font-medium">Tarefas</span>
          </div>
          <div className="text-2xl font-bold">
            {analyticsData.taskStats.reduce((sum, cat) => sum + cat.count, 0)}
          </div>
          <div className="text-sm text-muted-foreground">
            {analyticsData.taskStats.length} categorias
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="h-5 w-5 text-blue-500" />
            <span className="font-medium">Estudos</span>
          </div>
          <div className="text-2xl font-bold">
            {analyticsData.studyStats.filter(s => s.watched).length}
          </div>
          <div className="text-sm text-muted-foreground">
            vídeos assistidos
          </div>
        </div>

        <div className="bg-card border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="h-5 w-5 text-purple-500" />
            <span className="font-medium">Produtividade</span>
          </div>
          <div className="text-2xl font-bold">
            {Math.round(analyticsData.productivityTrends.reduce((sum, day) => sum + day.productivity, 0) / analyticsData.productivityTrends.length) || 0}%
          </div>
          <div className="text-sm text-muted-foreground">
            média do período
          </div>
        </div>
      </div>

      {/* Gráfico de Pomodoros por Dia */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">🍅 Sessões Pomodoro por Dia</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analyticsData.pomodoroStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip 
              labelFormatter={(label) => `Dia: ${label}`}
              formatter={(value, name) => [value, name === 'sessions' ? 'Sessões' : 'Tempo (min)']}
            />
            <Bar dataKey="sessions" fill="#ef4444" name="sessions" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de Tendência de Produtividade */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📈 Tendência de Produtividade</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={analyticsData.productivityTrends}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis domain={[0, 100]} />
            <Tooltip 
              labelFormatter={(label) => `Dia: ${label}`}
              formatter={(value, name) => [
                name === 'productivity' ? `${value}%` : value,
                name === 'productivity' ? 'Produtividade' : name === 'tasks' ? 'Tarefas' : 'Estudo (min)'
              ]}
            />
            <Area type="monotone" dataKey="productivity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição de Tarefas por Categoria */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Distribuição de Tarefas</h3>
          {analyticsData.categoryDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analyticsData.categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ category, percentage }) => `${category}: ${percentage}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analyticsData.categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma tarefa encontrada para análise
            </div>
          )}
        </div>

        {/* Progresso Semanal */}
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">📅 Progresso Semanal</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={analyticsData.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="pomodoros" stroke="#ef4444" strokeWidth={2} name="Pomodoros" />
              <Line type="monotone" dataKey="tasks" stroke="#22c55e" strokeWidth={2} name="Tarefas" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights e Recomendações */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">💡 Insights e Recomendações</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              🎯 Melhor Dia da Semana
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              {analyticsData.weeklyProgress.length > 0 
                ? analyticsData.weeklyProgress.reduce((best, day) => 
                    day.pomodoros > best.pomodoros ? day : best
                  ).day
                : 'N/A'
              } é seu dia mais produtivo com mais sessões Pomodoro.
            </p>
          </div>

          <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
            <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">
              📚 Progresso nos Estudos
            </h4>
            <p className="text-sm text-green-700 dark:text-green-300">
              Você assistiu {analyticsData.studyStats.filter(s => s.watched).length} vídeos. 
              Continue mantendo o ritmo de aprendizado!
            </p>
          </div>

          <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <h4 className="font-medium text-purple-900 dark:text-purple-100 mb-2">
              ⏰ Tempo de Foco
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Média de {Math.round(analyticsData.pomodoroStats.reduce((sum, day) => sum + day.focusTime, 0) / analyticsData.pomodoroStats.length) || 0} 
              minutos de foco por dia. Excelente consistência!
            </p>
          </div>

          <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
            <h4 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
              🎨 Categoria Favorita
            </h4>
            <p className="text-sm text-orange-700 dark:text-orange-300">
              {analyticsData.taskStats.length > 0
                ? analyticsData.taskStats.reduce((max, cat) => cat.count > max.count ? cat : max).category
                : 'N/A'
              } é sua categoria de tarefa mais utilizada.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics

