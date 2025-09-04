// src/App.jsx (VERSÃO COMPLETA E FINAL)

import './App.css';
import React, { useState, useEffect } from 'react';

// O QUE MUDOU: Importamos componentes e utilitários de autenticação
import Login from './components/Login';
import { initializeAuth, logout, getCurrentUser } from './utils/auth';
import { restoreDataOnLogin } from './utils/cloudSync';

// Seus imports de componentes existentes
import Dashboard from './components/Dashboard';
//import TaskManager from './components/TaskManager';
import TarefasPage from './components/TarefasPage';
import PomodoroTimer from './components/PomodoroTimer';
import VideoStudy from './components/VideoStudy';
import QuickNotes from './components/QuickNotes';
import TelosReview from './components/TelosReview';
import Analytics from './components/Analytics';
import CloudSync from './components/CloudSync';
import Collaboration from './components/Collaboration';
import Gamification from './components/Gamification';
import AIAssistant from './components/AIAssistant';
import Integrations from './components/Integrations';
import PWAManager from './components/PWAManager';
import TelosFramework from './components/TelosFramework.jsx';

// Seus imports de ícones
import { 
  Home, 
  CheckSquare, 
  Timer, 
  BookOpen, 
  FileText, 
  Users, 
  Cloud, 
  BarChart3, 
  Bot, 
  Link, 
  Trophy, 
  Target,
  Menu,
  X,
  Sun,
  Moon,
  Settings,
  LogOut,
  ClipboardCheck,  // O QUE MUDOU: Ícone de Logout adicionado
  Loader   // O QUE MUDOU: Ícone de Loading adicionado
} from 'lucide-react';

function App() {
  // O QUE MUDOU: Estados para controlar a autenticação
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Seus estados existentes, mantidos intactos
  const [activeSection, setActiveSection] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // O QUE MUDOU: useEffect agora tem duas responsabilidades:
  // 1. Verificar a autenticação
  // 2. Configurar a UI (tema, hash, etc.)
  useEffect(() => {
    // Função assíncrona para lidar com a autenticação e carregamento de dados
    const authAndLoad = async () => {
      const isAuthenticated = await initializeAuth();
      if (isAuthenticated) {
        setIsLoggedIn(true);
        setCurrentUser(getCurrentUser());
        // Após confirmar a autenticação, busca os dados da nuvem.
        await restoreDataOnLogin();
      }
      setIsLoading(false);
    };

    authAndLoad();

    // Sua lógica de UI existente, mantida intacta
    const savedTheme = localStorage.getItem('lex-flow-theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    const handleHashChange = () => {
      const hash = window.location.hash.substring(1);
      const sectionMap = {
        'tasks': 'tasks', 'pomodoro': 'pomodoro', 'study': 'study',
        'notes': 'notes', 'telos': 'telos', 'analytics': 'analytics',
        'cloud': 'cloud', 'collaboration': 'collaboration', 'ai': 'ai',
        'integrations': 'integrations', 'gamification': 'gamification'
      };
      
      if (sectionMap[hash]) {
        setActiveSection(sectionMap[hash]);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []); // O array vazio [] garante que isso rode apenas uma vez

  // O QUE MUDOU: Funções de callback para login e logout
  const handleLogout = () => {
    // Antes do logout, pode ser uma boa ideia fazer um último sync
    // cloudSync.syncData(); 
    logout(); // do auth.js (limpa localStorage e recarrega a página)
  };

  const handleLoginSuccess = async (user, token) => {
    // Esta função é chamada pelo componente Login após sucesso
    setIsLoggedIn(true);
    setCurrentUser(user);
    // Após o login, busca os dados da nuvem pela primeira vez.
    await restoreDataOnLogin();
    // O componente Login.jsx já recarrega a página, mas isso garante o fluxo correto
    // caso você remova o reload de lá no futuro.
  };

  // Sua lógica existente, mantida intacta
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lex-flow-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lex-flow-theme', 'light');
    }
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, color: 'text-blue-600' },
    { id: 'tasks', label: 'Tarefas', icon: CheckSquare, color: 'text-green-600' },
    { id: 'pomodoro', label: 'Pomodoro', icon: Timer, color: 'text-red-600' },
    { id: 'study', label: 'Estudos', icon: BookOpen, color: 'text-purple-600' },
    { id: 'notes', label: 'Anotações', icon: FileText, color: 'text-yellow-600' },
    { id: 'collaboration', label: 'Colaboração', icon: Users, color: 'text-indigo-600' },
    { id: 'cloud', label: 'Nuvem', icon: Cloud, color: 'text-sky-600' },
    { id: 'analytics', label: 'Análises', icon: BarChart3, color: 'text-orange-600' },
    { id: 'ai', label: 'Assistente IA', icon: Bot, color: 'text-violet-600' },
    { id: 'integrations', label: 'Integrações', icon: Link, color: 'text-cyan-600' },
    { id: 'gamification', label: 'Gamificação', icon: Trophy, color: 'text-amber-600' },
    { id: 'telos', label: 'TELOS Review', icon: Target, color: 'text-rose-600' },
    { id: 'telos-framework', label: 'Framework TELOS', icon: ClipboardCheck, color: 'text-pink-600' }
  ];

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return <Dashboard />;
      // case 'tasks': return <TaskManager />;
      case 'tasks': return <TarefasPage />; 
      case 'pomodoro': return <PomodoroTimer />;
      case 'study': return <VideoStudy />;
      case 'notes': return <QuickNotes />;
      case 'collaboration': return <Collaboration />;
      case 'cloud': return <CloudSync />;
      case 'analytics': return <Analytics />;
      case 'gamification': return <Gamification />;
      case 'ai': return <AIAssistant />;
      case 'integrations': return <Integrations />;
      case 'telos': return <TelosReview />;
      case 'telos-framework': return <TelosFramework />;
      default: return <Dashboard />;
    }
  };

  const handleSectionChange = (sectionId) => {
    setActiveSection(sectionId);
    window.location.hash = sectionId;
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  // O QUE MUDOU: Renderização condicional baseada no estado de autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader className="w-10 h-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Login onLogin={handleLoginSuccess} />;
  }
  
  // O seu JSX original é retornado aqui, com pequenas modificações no header e sidebar.
  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      <PWAManager />
      
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-40">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">L</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Lex Flow</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title={darkMode ? 'Modo Claro' : 'Modo Escuro'}
            >
              {darkMode ? <Sun className="w-5 h-5 text-yellow-500" /> : <Moon className="w-5 h-5 text-gray-600" />}
            </button>
            
            <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </button>

            {/* O QUE MUDOU: Adicionado botão de Logout */}
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              title="Sair"
            >
              <LogOut className="w-5 h-5 text-red-600" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        <aside className={`
          fixed lg:static inset-y-0 left-0 z-30 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 
          transform transition-transform duration-300 ease-in-out lg:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${!sidebarOpen && 'lg:w-16'}
        `}>
          <div className="flex flex-col h-full pt-4">
            {/* O QUE MUDOU: Exibindo informações do usuário na sidebar */}
            {(sidebarOpen || window.innerWidth < 1024) && currentUser && (
              <div className="px-4 pb-4 mb-4 border-b border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{currentUser.username}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser.email}</p>
              </div>
            )}
            
            <nav className="flex-1 px-3 space-y-1">
              {menuItems.map((item) => {
                const IconComponent = item.icon;
                const isActive = activeSection === item.id;
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSectionChange(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 font-semibold' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }
                    `}
                  >
                    <IconComponent className={`w-5 h-5 ${isActive ? item.color : 'text-gray-500 dark:text-gray-400'}`} />
                    {(sidebarOpen || window.innerWidth < 1024) && (
                      <span className="font-medium">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            {(sidebarOpen || window.innerWidth < 1024) && (
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                  Lex Flow v2.0
                  <br />
                  Produtividade Pessoal
                </div>
              </div>
            )}
          </div>
        </aside>

        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="flex-1 min-h-screen">
          <div className="p-6">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;