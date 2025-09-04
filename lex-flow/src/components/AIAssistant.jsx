import React, { useState, useEffect } from 'react';
import { 
    Brain, Lightbulb, TrendingUp, BookOpen, Calendar, Zap, Target,
    Clock, Star, RefreshCw, Loader2, CheckCircle, AlertCircle, Info
} from 'lucide-react';
import { toast } from 'sonner';
import { 
    getAiProviders,
    getTaskSuggestions,
    getProductivityInsights,
    getStudyRecommendations,
    getScheduleOptimization,
    createTask // Reutiliza a função de criar tarefa
} from '../utils/api';

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

    // Função genérica para buscar dados da IA baseada na aba ativa
    const fetchDataForTab = async (tab) => {
        setLoading(true);
        setError(null);
        try {
            let response;
            // --- DADOS DE EXEMPLO PARA ENVIAR PARA A IA ---
            // No futuro, estes dados devem vir do estado global do seu app
            const mockContext = {
                current_tasks: [{ title: 'Finalizar relatório de vendas' }, { title: 'Corrigir bug na API de login' }],
                completed_tasks: [{ title: 'Reunião com equipe de marketing' }],
                goals: ['Lançar nova feature de colaboração até o final do mês'],
                pomodoro_sessions: [{ duration_minutes: 25 }, { duration_minutes: 25 }],
                study_topics: ['React Hooks', 'Async/Await em Python']
            };

            switch (tab) {
                case 'suggestions':
                    // Agora enviamos o contexto para a API
                    response = await getTaskSuggestions(mockContext);
                    setAiData(prev => ({ ...prev, suggestions: response.suggestions || [] }));
                    break;
                case 'insights':
                    // Enviamos o contexto para a API
                    response = await getProductivityInsights(mockContext);
                    setAiData(prev => ({ ...prev, insights: response.insights || null }));
                    break;
                case 'study':
                    // Enviamos o contexto para a API
                    response = await getStudyRecommendations(mockContext);
                    setAiData(prev => ({ ...prev, recommendations: response.recommendations || [] }));
                    break;
                case 'schedule':
                    // Enviamos o contexto para a API
                    response = await getScheduleOptimization(mockContext);
                    setAiData(prev => ({ ...prev, schedule: response.optimization || null }));
                    break;
                default:
                    return;
            }
        } catch (err) {
            console.error(`Erro ao buscar dados para a aba ${tab}:`, err);
            setError(err.message || 'Erro de conexão com o servidor de IA');
            toast.error(`Não foi possível carregar dados para ${tab}.`);
        } finally {
            setLoading(false);
        }
    };

    // Efeito para carregar dados iniciais e ao mudar de aba
    useEffect(() => {
        checkAIProviders();
        fetchDataForTab(activeTab);
    }, [activeTab]);

    const checkAIProviders = async () => {
        try {
            const data = await getAiProviders();
            setAiProviders(data.providers || []);
        } catch (error) {
            console.error('Erro ao verificar provedores de IA:', error);
            setAiProviders([]);
        }
    };
    
    // Função para adicionar tarefa a partir de uma sugestão da IA
    const addTaskFromSuggestion = async (suggestion) => {
        const taskData = {
            title: suggestion.title,
            description: suggestion.description,
            priority: suggestion.priority,
            category: suggestion.category,
            // O backend deve assumir um projeto padrão se o projectId não for fornecido
        };
        try {
            // Supondo que a função createTask não precise de projectId ou que o backend lide com isso
            await createTask(null, taskData); // Passa null para projectId
            toast.success(`Tarefa "${suggestion.title}" adicionada com sucesso!`);
        } catch (error) {
            console.error("Erro ao adicionar tarefa da sugestão:", error);
            toast.error("Não foi possível adicionar a tarefa sugerida.");
        }
    };

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
                <h3 className="text-lg font-semibold flex items-center gap-2"><Lightbulb className="w-5 h-5 text-yellow-500" />Sugestões Inteligentes de Tarefas</h3>
                <button onClick={() => fetchDataForTab('suggestions')} disabled={loading} className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Atualizar
                </button>
            </div>
            {error && (<div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg"><AlertCircle className="w-4 h-4" />{error}</div>)}
            <div className="grid gap-4">
                {aiData.suggestions.map((suggestion, index) => (
                    <div key={index} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <h4 className="font-medium">{suggestion.title}</h4>
                                <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                                <div className="flex items-center gap-4 mt-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(suggestion.priority)}`}>{suggestion.priority}</span>
                                    <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{suggestion.estimated_time} min</span>
                                    <span className="text-xs text-muted-foreground capitalize">{suggestion.category}</span>
                                </div>
                                {suggestion.reasoning && (<p className="text-xs text-muted-foreground mt-2 italic">💡 {suggestion.reasoning}</p>)}
                            </div>
                            <button onClick={() => addTaskFromSuggestion(suggestion)} className="ml-4 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">Adicionar</button>
                        </div>
                    </div>
                ))}
            </div>
            {aiData.suggestions.length === 0 && !loading && (
                <div className="text-center py-8 text-muted-foreground"><Brain className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhuma sugestão disponível. Clique em "Atualizar".</p></div>
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
                <h2 className="text-2xl font-bold flex items-center gap-3"><Brain className="w-8 h-8 text-purple-600" />Assistente de IA</h2>
                <p className="text-muted-foreground mt-2">Sugestões inteligentes para otimizar sua produtividade</p>
                <div className="flex items-center gap-2 mt-3">
                    <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${aiProviders.length > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-muted-foreground">{aiProviders.length > 0 ? `${aiProviders.length} provedor(es) ativo(s)` : 'IA indisponível'}</span>
                    </div>
                    {aiProviders.length > 0 && (<div className="text-xs text-muted-foreground">({aiProviders.join(', ')})</div>)}
                </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6 border-b">
                {[{ id: 'suggestions', label: 'Sugestões', icon: Lightbulb }, { id: 'insights', label: 'Insights', icon: TrendingUp }, { id: 'study', label: 'Estudos', icon: BookOpen }, { id: 'schedule', label: 'Cronograma', icon: Calendar }].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                        <tab.icon className="w-4 h-4" />{tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white rounded-lg p-6">
                {loading && (<div className="flex items-center justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /><span className="ml-3 text-muted-foreground">Processando com IA...</span></div>)}
                {!loading && (
                    <>
                        {activeTab === 'suggestions' && renderTaskSuggestions()}
                        {activeTab === 'insights' && renderProductivityInsights()}
                        {activeTab === 'study' && renderStudyRecommendations()}
                        {activeTab === 'schedule' && renderScheduleOptimization()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AIAssistant;
