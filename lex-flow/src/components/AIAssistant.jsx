import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  BookOpen, 
  Calendar,
  Zap,
  Target,
  Clock,
  Star,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';

const AIAssistant = () => {
  const [activeTab, setActiveTab] = useState('suggestions');
  const [loading, setLoading] = useState(false);
  const [aiData, setAiData] = useState({
    suggestions: [],
    insights: null,
    recommendations: [],
    schedule: null
  });
  const [aiProviders, setAiProviders] = useState([]);
  const [error, setError] = useState(null);

  // Simular dados do usuário (em uma implementação real, viria do contexto/estado global)
  const getUserContext = () => {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const completedTasks = tasks.filter(task => task.completed);
    const currentTasks = tasks.filter(task => !task.completed);
    
    return {
      current_tasks: currentTasks.slice(0, 5), // Últimas 5 tarefas
      completed_tasks: completedTasks.slice(-10), // Últimas 10 concluídas
      goals: JSON.parse(localStorage.getItem('user_goals') || '["Aumentar produtividade", "Aprender novas tecnologias"]'),
      preferences: {
        work_hours: '09:00-18:00',
        break_frequency: 25,
        focus_areas: ['desenvolvimento', 'estudos', 'projetos pessoais']
      }
    };
  };

  const getProductivityData = () => {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const pomodoroSessions = JSON.parse(localStorage.getItem('pomodoro_history') || '[]');
    const studySessions = JSON.parse(localStorage.getItem('study_sessions') || '[]');
    
    return {
      tasks_completed: tasks.filter(task => task.completed),
      pomodoro_sessions: pomodoroSessions,
      study_sessions: studySessions,
      daily_stats: {
        tasks_today: tasks.filter(task => {
          const today = new Date().toDateString();
          return task.completed && new Date(task.completed_at).toDateString() === today;
        }).length,
        focus_time_today: pomodoroSessions.reduce((total, session) => {
          const today = new Date().toDateString();
          return new Date(session.date).toDateString() === today ? total + session.duration : total;
        }, 0)
      }
    };
  };

  const getStudyContext = () => {
    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    return {
      completed_videos: videos.filter(video => video.watched),
      study_topics: [...new Set(videos.map(video => video.category).filter(Boolean))],
      learning_goals: ['React', 'Node.js', 'Python', 'Machine Learning'],
      interests: notes.map(note => note.category).filter(Boolean),
      time_available: '30 minutos'
    };
  };

  // --- INÍCIO DA CORREÇÃO: Função auxiliar para chamadas API com autenticação ---
  const fetchApi = async (url, options = {}) => {
    // Pega o token de acesso do localStorage.
    // **IMPORTANTE**: Altere 'authToken' para a chave correta que você usa para guardar o token após o login.
    const token = localStorage.getItem('lex_flow_token'); 
    console.log("Tentando buscar token... Chave: 'lex_flow_token', Valor encontrado:", token);

    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Adiciona o cabeçalho de autorização se o token existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      } else {
    // --- INÍCIO DA DEPURAÇÃO ---
    // Adiciona um log para sabermos que o token não foi encontrado e o cabeçalho não foi adicionado.
      console.warn("Token não encontrado no localStorage. O cabeçalho 'Authorization' NÃO será enviado.");
    // --- FIM DA DEPURAÇÃO ---
    }

    // Executa a requisição com os cabeçalhos atualizados
    const response = await fetch(url, {
      ...options,
      headers: headers,
    });

    return response;
  };
  // --- FIM DA CORREÇÃO ---

  const checkAIProviders = async () => {
    try {
      // ANTES: const response = await fetch('/api/ai/providers');
      // DEPOIS: Usa a função fetchApi para manter o padrão, embora esta rota possa não precisar de token.
      const response = await fetchApi('/api/ai/providers');
      const data = await response.json();
      if (data.success) {
        setAiProviders(data.providers);
      }
    } catch (error) {
      console.error('Erro ao verificar provedores de IA:', error);
      setAiProviders([]);
    }
  };

  const fetchTaskSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const userContext = getUserContext();
      // ANTES: const response = await fetch('/api/ai/task-suggestions', { ... });
      // DEPOIS: A função fetchApi adiciona o token de autenticação automaticamente.
      const response = await fetchApi('/api/ai/task-suggestions', {
        method: 'POST',
        body: JSON.stringify(userContext)
      });
      
      const data = await response.json();
      if (data.success) {
        setAiData(prev => ({ ...prev, suggestions: data.suggestions }));
      } else {
        // Agora, o erro "Token de acesso requerido" será exibido aqui corretamente se o backend o enviar.
        setError('Erro ao obter sugestões: ' + data.error);
        setAiData(prev => ({ ...prev, suggestions: data.suggestions || [] }));
      }
    } catch (error) {
      setError('Erro de conexão com o servidor de IA');
      console.error('Erro ao buscar sugestões:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProductivityInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const productivityData = getProductivityData();
      // ANTES: const response = await fetch('/api/ai/productivity-insights', { ... });
      // DEPOIS: A função fetchApi adiciona o token de autenticação automaticamente.
      const response = await fetchApi('/api/ai/productivity-insights', {
        method: 'POST',
        body: JSON.stringify(productivityData)
      });
      
      const data = await response.json();
      if (data.success) {
        setAiData(prev => ({ ...prev, insights: data.insights }));
      } else {
        setError('Erro ao obter insights: ' + data.error);
        setAiData(prev => ({ ...prev, insights: data.insights || null }));
      }
    } catch (error) {
      setError('Erro de conexão com o servidor de IA');
      console.error('Erro ao buscar insights:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudyRecommendations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const studyContext = getStudyContext();
      // ANTES: const response = await fetch('/api/ai/study-recommendations', { ... });
      // DEPOIS: A função fetchApi adiciona o token de autenticação automaticamente.
      const response = await fetchApi('/api/ai/study-recommendations', {
        method: 'POST',
        body: JSON.stringify(studyContext)
      });
      
      const data = await response.json();
      if (data.success) {
        setAiData(prev => ({ ...prev, recommendations: data.recommendations }));
      } else {
        setError('Erro ao obter recomendações: ' + data.error);
        setAiData(prev => ({ ...prev, recommendations: data.recommendations || [] }));
      }
    } catch (error) {
      setError('Erro de conexão com o servidor de IA');
      console.error('Erro ao buscar recomendações:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScheduleOptimization = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const scheduleData = {
        current_schedule: JSON.parse(localStorage.getItem('schedule') || '[]'),
        productivity_patterns: {
          best_hours: ['09:00-11:00', '14:00-16:00'],
          energy_levels: { morning: 'high', afternoon: 'medium', evening: 'low' }
        },
        task_priorities: getUserContext().current_tasks,
        preferences: { work_style: 'focused_blocks', break_frequency: 25 }
      };
      
      // ANTES: const response = await fetch('/api/ai/schedule-optimization', { ... });
      // DEPOIS: A função fetchApi adiciona o token de autenticação automaticamente.
      const response = await fetchApi('/api/ai/schedule-optimization', {
        method: 'POST',
        body: JSON.stringify(scheduleData)
      });
      
      const data = await response.json();
      if (data.success) {
        setAiData(prev => ({ ...prev, schedule: data.optimization }));
      } else {
        setError('Erro ao otimizar cronograma: ' + data.error);
        setAiData(prev => ({ ...prev, schedule: data.optimization || null }));
      }
    } catch (error) {
      setError('Erro de conexão com o servidor de IA');
      console.error('Erro ao otimizar cronograma:', error);
    } finally {
      setLoading(false);
    }
  };

  const addTaskFromSuggestion = (suggestion) => {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const newTask = {
      id: Date.now(),
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      category: suggestion.category,
      completed: false,
      created_at: new Date().toISOString(),
      estimated_time: parseInt(suggestion.estimated_time) || 30
    };
    
    tasks.push(newTask);
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    // Mostrar feedback visual
    alert(`Tarefa "${suggestion.title}" adicionada com sucesso!`);
  };

  useEffect(() => {
    checkAIProviders();
    // Carregar dados iniciais baseado na aba ativa
    if (activeTab === 'suggestions') {
      fetchTaskSuggestions();
    }
  }, []);

  useEffect(() => {
    // Carregar dados quando a aba muda
    switch (activeTab) {
      case 'suggestions':
        if (aiData.suggestions.length === 0) fetchTaskSuggestions();
        break;
      case 'insights':
        if (!aiData.insights) fetchProductivityInsights();
        break;
      case 'study':
        if (aiData.recommendations.length === 0) fetchStudyRecommendations();
        break;
      case 'schedule':
        if (!aiData.schedule) fetchScheduleOptimization();
        break;
    }
  }, [activeTab]);

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'alta': return 'text-red-600 bg-red-50';
      case 'média': return 'text-yellow-600 bg-yellow-50';
      case 'baixa': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact?.toLowerCase()) {
      case 'alto': return 'text-red-600';
      case 'médio': return 'text-yellow-600';
      case 'baixo': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const renderTaskSuggestions = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-yellow-500" />
          Sugestões Inteligentes de Tarefas
        </h3>
        <button
          onClick={fetchTaskSuggestions}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Atualizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {aiData.suggestions.map((suggestion, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{suggestion.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{suggestion.description}</p>
                
                <div className="flex items-center gap-4 mt-3">
                  <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(suggestion.priority)}`}>
                    {suggestion.priority}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {suggestion.estimated_time} min
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {suggestion.category}
                  </span>
                </div>
                
                {suggestion.reasoning && (
                  <p className="text-xs text-gray-500 mt-2 italic">
                    💡 {suggestion.reasoning}
                  </p>
                )}
              </div>
              
              <button
                onClick={() => addTaskFromSuggestion(suggestion)}
                className="ml-4 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Adicionar
              </button>
            </div>
          </div>
        ))}
      </div>

      {aiData.suggestions.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <Brain className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma sugestão disponível no momento.</p>
          <button
            onClick={fetchTaskSuggestions}
            className="mt-2 text-blue-500 hover:text-blue-600"
          >
            Gerar sugestões
          </button>
        </div>
      )}
    </div>
  );

  const renderProductivityInsights = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Insights de Produtividade
        </h3>
        <button
          onClick={fetchProductivityInsights}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Analisar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {aiData.insights ? (
        <div className="space-y-6">
          {/* Score Geral */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Score de Produtividade</h4>
              <div className="text-2xl font-bold text-blue-600">
                {aiData.insights.overall_score}/100
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ width: `${aiData.insights.overall_score}%` }}
              ></div>
            </div>
          </div>

          {/* Pontos Fortes */}
          <div className="p-4 border border-green-200 rounded-lg bg-green-50">
            <h4 className="font-medium text-green-800 flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4" />
              Pontos Fortes
            </h4>
            <ul className="space-y-1">
              {aiData.insights.strengths?.map((strength, index) => (
                <li key={index} className="text-sm text-green-700 flex items-center gap-2">
                  <Star className="w-3 h-3" />
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          {/* Áreas de Melhoria */}
          <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
            <h4 className="font-medium text-yellow-800 flex items-center gap-2 mb-3">
              <Target className="w-4 h-4" />
              Áreas para Melhorar
            </h4>
            <ul className="space-y-1">
              {aiData.insights.areas_for_improvement?.map((area, index) => (
                <li key={index} className="text-sm text-yellow-700 flex items-center gap-2">
                  <Zap className="w-3 h-3" />
                  {area}
                </li>
              ))}
            </ul>
          </div>

          {/* Recomendações */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Recomendações Personalizadas</h4>
            {aiData.insights.recommendations?.map((rec, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h5 className="font-medium text-gray-900">{rec.title}</h5>
                    <p className="text-sm text-gray-600 mt-1">{rec.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className={`text-xs ${getImpactColor(rec.impact)}`}>
                        Impacto: {rec.impact}
                      </span>
                      <span className="text-xs text-gray-500">
                        Esforço: {rec.effort}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tendências */}
          {aiData.insights.trends && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-3">Padrões Identificados</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Tendência:</span>
                  <span className="ml-2 font-medium capitalize">{aiData.insights.trends.productivity_trend}</span>
                </div>
                <div>
                  <span className="text-gray-600">Melhor período:</span>
                  <span className="ml-2 font-medium capitalize">{aiData.insights.trends.focus_pattern}</span>
                </div>
                <div>
                  <span className="text-gray-600">Melhor dia:</span>
                  <span className="ml-2 font-medium capitalize">{aiData.insights.trends.best_day}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="text-center py-8 text-gray-500">
          <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Clique em "Analisar" para obter insights personalizados.</p>
        </div>
      )}
    </div>
  );

  const renderStudyRecommendations = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-purple-500" />
          Recomendações de Estudo
        </h3>
        <button
          onClick={fetchStudyRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Recomendar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      <div className="grid gap-4">
        {aiData.recommendations.map((rec, index) => (
          <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900">{rec.title}</h4>
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                    {rec.type}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                
                <div className="flex items-center gap-4 mb-2">
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {rec.estimated_time}
                  </span>
                  <span className="text-xs text-gray-500 capitalize">
                    {rec.difficulty}
                  </span>
                  <span className="text-xs text-blue-600 font-medium">
                    {rec.relevance_score}% relevante
                  </span>
                </div>
                
                {rec.topics && rec.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {rec.topics.map((topic, topicIndex) => (
                      <span key={topicIndex} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                        {topic}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex flex-col gap-2">
                {rec.url && (
                  <a
                    href={rec.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Acessar
                  </a>
                )}
                <button
                  onClick={() => {
                    // Adicionar à lista de estudos
                    const videos = JSON.parse(localStorage.getItem('videos') || '[]');
                    const newVideo = {
                      id: Date.now(),
                      title: rec.title,
                      url: rec.url || '',
                      category: rec.topics?.[0] || 'geral',
                      watched: false,
                      notes: rec.description,
                      added_at: new Date().toISOString()
                    };
                    videos.push(newVideo);
                    localStorage.setItem('videos', JSON.stringify(videos));
                    alert(`"${rec.title}" adicionado à sua lista de estudos!`);
                  }}
                  className="px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {aiData.recommendations.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma recomendação disponível no momento.</p>
          <button
            onClick={fetchStudyRecommendations}
            className="mt-2 text-blue-500 hover:text-blue-600"
          >
            Gerar recomendações
          </button>
        </div>
      )}
    </div>
  );

  const renderScheduleOptimization = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Otimização de Cronograma
        </h3>
        <button
          onClick={fetchScheduleOptimization}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Otimizar
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {aiData.schedule ? (
        <div className="space-y-6">
          {/* Score de Produtividade */}
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Score de Produtividade Estimado</h4>
              <div className="text-2xl font-bold text-green-600">
                {aiData.schedule.productivity_score}/100
              </div>
            </div>
          </div>

          {/* Cronograma Otimizado */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Cronograma Otimizado</h4>
            {aiData.schedule.optimized_schedule?.map((slot, index) => (
              <div key={index} className="p-3 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-blue-600">{slot.time_slot}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        slot.energy_level === 'alta' ? 'bg-red-100 text-red-700' :
                        slot.energy_level === 'média' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        Energia {slot.energy_level}
                      </span>
                    </div>
                    <h5 className="font-medium text-gray-900 mt-1">{slot.activity}</h5>
                    <p className="text-sm text-gray-600 mt-1">{slot.reasoning}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Melhorias Sugeridas */}
          {aiData.schedule.improvements && aiData.schedule.improvements.length > 0 && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Melhorias Sugeridas
              </h4>
              <ul className="space-y-2">
                {aiData.schedule.improvements.map((improvement, index) => (
                  <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : !loading && (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Clique em "Otimizar" para receber sugestões de cronograma.</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <Brain className="w-8 h-8 text-purple-600" />
          Assistente de IA
        </h2>
        <p className="text-gray-600 mt-2">
          Sugestões inteligentes para otimizar sua produtividade
        </p>
        
        {/* Status dos Provedores */}
        <div className="flex items-center gap-2 mt-3">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${aiProviders.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-sm text-gray-600">
              {aiProviders.length > 0 ? `${aiProviders.length} provedor(es) ativo(s)` : 'IA indisponível'}
            </span>
          </div>
          {aiProviders.length > 0 && (
            <div className="text-xs text-gray-500">
              ({aiProviders.join(', ')})
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {[
          { id: 'suggestions', label: 'Sugestões', icon: Lightbulb },
          { id: 'insights', label: 'Insights', icon: TrendingUp },
          { id: 'study', label: 'Estudos', icon: BookOpen },
          { id: 'schedule', label: 'Cronograma', icon: Calendar }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das Tabs */}
      <div className="bg-white rounded-lg">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <span className="ml-3 text-gray-600">Processando com IA...</span>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'suggestions' && renderTaskSuggestions()}
            {activeTab === 'insights' && renderProductivityInsights()}
            {activeTab === 'study' && renderStudyRecommendations()}
            {activeTab === 'schedule' && renderScheduleOptimization()}
          </>
        )}
      </div>

      {/* Aviso sobre IA */}
      {aiProviders.length === 0 && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">IA Temporariamente Indisponível</h4>
              <p className="text-sm text-yellow-700 mt-1">
                As funcionalidades de IA estão funcionando com dados locais. Para obter sugestões mais precisas, 
                configure as chaves de API do OpenAI ou Google Gemini no backend.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIAssistant;