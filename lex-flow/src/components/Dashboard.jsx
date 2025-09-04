import { getDashboardData } from '../utils/api';
import { toast } from 'sonner';
import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle, 
  BookOpen, 
  FileText, 
  Target,
  TrendingUp,
  Zap,
  Quote,
  ArrowRight,
  Plus,
  Play,
  Edit3,
  Video,
  RotateCcw
} from 'lucide-react';

const Dashboard = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dailyQuote, setDailyQuote] = useState('');
  const [stats, setStats] = useState({
      pomodoros: 0,
      tasksCompleted: 0,
      videosWatched: 0,
      quickNotes: 0
  });
  const [isLoading, setIsLoading] = useState(true); // Adicionado para feedback ao usuário

  // Mantenha seu array de frases original como um fallback
  const quotes = [
      "Foco não é saber o que fazer, é escolher o que não fazer agora.",
      "A disciplina é a ponte entre objetivos e conquistas.",
      "Pequenos progressos diários levam a grandes resultados.",
      "O que você faz hoje pode melhorar todos os seus amanhãs.",
      "Seja você mesmo a mudança que deseja ver no mundo.",
      "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
      "Não espere por oportunidades extraordinárias. Agarre ocasiões comuns e as torne grandiosas.",
      "A excelência não é um ato, mas um hábito."
  ];

  const loadDashboardData = async () => {
      setIsLoading(true); // Inicia o carregamento
      try {
          const response = await getDashboardData();
          
          // Define as estatísticas a partir da API, com um fallback
          setStats(response.stats || { pomodoros: 0, tasksCompleted: 0, videosWatched: 0, quickNotes: 0 });

          // Define a frase do dia a partir da API, ou escolhe uma aleatória do array local como fallback
          if (response.quote) {
              setDailyQuote(response.quote);
          } else {
              const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
              setDailyQuote(randomQuote);
          }
      } catch (error) {
          console.error("Erro ao carregar dados do dashboard:", error);
          toast.error("Não foi possível carregar os dados do dashboard.");
          // Em caso de erro, usa uma frase padrão
          setDailyQuote("A jornada de mil milhas começa com um único passo.");
      } finally {
          setIsLoading(false); // Finaliza o carregamento
      }
  };

  useEffect(() => {
      // Atualizar data a cada minuto
      const timer = setInterval(() => {
          setCurrentDate(new Date());
      }, 60000);

      // Carregar dados do backend na primeira vez
      loadDashboardData();

      return () => clearInterval(timer);
  }, []); // A dependência vazia [] garante que isso rode apenas uma vez

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const quickActions = [
    {
      id: 'pomodoro',
      title: 'Iniciar Pomodoro',
      description: 'Comece uma sessão de foco',
      icon: Play,
      color: 'bg-red-500 hover:bg-red-600',
      hash: '#pomodoro'
    },
    {
      id: 'task',
      title: 'Nova Tarefa',
      description: 'Adicione uma nova tarefa',
      icon: Plus,
      color: 'bg-green-500 hover:bg-green-600',
      hash: '#tasks'
    },
    {
      id: 'note',
      title: 'Anotação Rápida',
      description: 'Capture uma ideia rapidamente',
      icon: Edit3,
      color: 'bg-yellow-500 hover:bg-yellow-600',
      hash: '#notes'
    },
    {
      id: 'video',
      title: 'Adicionar Vídeo',
      description: 'Adicione um vídeo para estudar',
      icon: Video,
      color: 'bg-purple-500 hover:bg-purple-600',
      hash: '#study'
    },
    {
      id: 'telos',
      title: 'Revisão TELOS',
      description: 'Reflita sobre seu dia',
      icon: Target,
      color: 'bg-rose-500 hover:bg-rose-600',
      hash: '#telos'
    }
  ];

  const statCards = [
    {
      title: 'Pomodoros Hoje',
      value: stats.pomodoros,
      icon: Clock,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      title: 'Tarefas Concluídas',
      value: stats.tasksCompleted,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      title: 'Vídeos Estudados',
      value: stats.videosWatched,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      title: 'Anotações Rápidas',
      value: stats.quickNotes,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    }
  ];

  const handleQuickAction = (hash) => {
    window.location.hash = hash;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Bem-vindo de volta!
          </h1>
          <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4" />
            <span className="capitalize">{formatDate(currentDate)}</span>
            <span className="mx-2">•</span>
            <Clock className="w-4 h-4" />
            <span>{formatTime(currentDate)}</span>
          </div>
        </div>
        
        <button
          onClick={loadDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Atualizar
        </button>
      </div>

      {/* Frase do Dia */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-6 text-white">
        <div className="flex items-start gap-4">
          <Quote className="w-8 h-8 text-blue-200 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-lg font-semibold mb-2">Frase do Dia</h2>
            <p className="text-blue-100 text-lg leading-relaxed italic">
              "{dailyQuote}"
            </p>
          </div>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                  <IconComponent className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Top 3 Prioridades */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-6 h-6 text-rose-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Top 3 Prioridades de Hoje
          </h2>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Target className="w-12 h-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p className="text-lg font-medium">Nenhuma prioridade definida ainda.</p>
              <p className="text-sm mt-2">Vá para a seção de Tarefas para definir suas prioridades.</p>
              <button
                onClick={() => handleQuickAction('#tasks')}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Definir Prioridades
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-6">
          <Zap className="w-6 h-6 text-yellow-600" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ações Rápidas
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => handleQuickAction(action.hash)}
                className={`
                  p-4 rounded-xl text-white transition-all duration-200 hover:scale-105 hover:shadow-lg
                  ${action.color}
                `}
              >
                <IconComponent className="w-6 h-6 mx-auto mb-3" />
                <h3 className="font-semibold text-sm mb-1">{action.title}</h3>
                <p className="text-xs opacity-90">{action.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Progresso Semanal */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Progresso da Semana
            </h2>
          </div>
          <button
            onClick={() => handleQuickAction('#analytics')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            Ver Detalhes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.pomodoros}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Pomodoros
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.tasksCompleted}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Tarefas
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.videosWatched}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Estudos
            </div>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {stats.quickNotes}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Anotações
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

