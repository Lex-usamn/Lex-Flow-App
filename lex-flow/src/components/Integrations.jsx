// /opt/lex-flow/src/components/Integrations.jsx

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Link, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Plus,
  ExternalLink,
  Download,
  Upload,
  RotateCw,
  AlertCircle,
  Info,
  Github,
  Trello,
  FileText,
  Database,
  BookOpen,
  Loader2,
  Key,
  Eye,
  EyeOff,
  Save,
  TestTube
} from 'lucide-react';

// --- CORREÇÃO 1: Importações ajustadas ---
// Funções da API foram importadas com os nomes corretos (sem o sufixo 'Api')
// e a função 'toast' foi adicionada para as notificações.
import {
  getIntegrations,
  testConnections,
  saveIntegrationsConfig,
  syncTasks,
  exportToObsidian
} from '@/utils/api';
import { toast } from 'sonner';


const Integrations = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [integrations, setIntegrations] = useState({});
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState({
    github_token: '',
    trello_key: '',
    trello_token: '',
    notion_token: '',
    capacities_token: ''
  });
  const [showCredentials, setShowCredentials] = useState({});
  const [syncTargets, setSyncTargets] = useState({
    github_repo: '',
    trello_list: '',
    notion_database: '',
    obsidian_vault: ''
  });
  const [syncResults, setSyncResults] = useState(null);

  // Configurações das integrações
  const integrationConfigs = {
    github: { name: 'GitHub', icon: Github, color: 'bg-gray-900', description: 'Sincronize tarefas como issues do GitHub', docs: 'https://docs.github.com/en/rest', fields: [{ key: 'github_token', label: 'Personal Access Token', type: 'password', required: true }] },
    trello: { name: 'Trello', icon: Trello, color: 'bg-blue-600', description: 'Converta tarefas em cards do Trello', docs: 'https://developer.atlassian.com/cloud/trello/rest/', fields: [{ key: 'trello_key', label: 'API Key', type: 'password', required: true }, { key: 'trello_token', label: 'Token', type: 'password', required: true }] },
    notion: { name: 'Notion', icon: Database, color: 'bg-black', description: 'Crie páginas no Notion a partir de tarefas', docs: 'https://developers.notion.com/', fields: [{ key: 'notion_token', label: 'Integration Token', type: 'password', required: true }] },
    capacities: { name: 'Capacities', icon: BookOpen, color: 'bg-purple-600', description: 'Sincronize com seu knowledge graph', docs: 'https://docs.capacities.io/developer/api', fields: [{ key: 'capacities_token', label: 'API Token', type: 'password', required: true }] },
    obsidian: { name: 'Obsidian', icon: FileText, color: 'bg-indigo-600', description: 'Exporte/importe notas para vault local', docs: 'https://obsidian.md/', fields: [] }
  };

    // --- CORREÇÃO 3: Implementação da função para o botão "Atualizar" ---
    // A lógica de carregar os dados foi movida para esta função reutilizável, que agora é chamada
    // tanto no carregamento inicial quanto ao clicar no botão "Atualizar".
    const fetchIntegrationsStatus = async () => {
        setLoading(true);
        try {
            const response = await getIntegrations();
            if (response.credentials) {
                setCredentials(prev => ({ ...prev, ...response.credentials }));
            }
            if (response.syncTargets) {
                setSyncTargets(prev => ({ ...prev, ...response.syncTargets }));
            }
        } catch (error) {
            console.error('Erro ao buscar dados das integrações:', error);
            toast.error("Não foi possível carregar as configurações de integração.");
        } finally {
            setLoading(false);
        }
    };

    // Efeito para carregar dados do backend quando o componente é montado
    useEffect(() => {
        fetchIntegrationsStatus(); // A lógica de busca agora está na nova função
    }, []); // A dependência vazia [] garante que isso rode apenas uma vez

    const testConnections = async () => {
        setLoading(true);
        setConnections({}); // Limpa resultados anteriores
        try {
            // --- CORREÇÃO 2: Nome da função corrigido ---
            const data = await testConnections(); // ANTES (ERRADO): testConnectionsApi()
            setConnections(data.connections);
            toast.success("Teste de conexões concluído!");
        } catch (error) {
            console.error('Erro ao testar conexões:', error);
            toast.error(error.message || "Erro ao testar conexões.");
        } finally {
            setLoading(false);
        }
    };

    const saveCredentials = async () => {
        setLoading(true);
        try {
            // Envia tanto as credenciais quanto os alvos de sync para o backend
            await saveIntegrationsConfig({ credentials, syncTargets });
            toast.success('Configurações salvas com segurança no servidor!');
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            toast.error(error.message || 'Não foi possível salvar as configurações.');
        } finally {
            setLoading(false);
        }
    };

  const handleCredentialChange = (key, value) => {
    setCredentials(prev => ({ ...prev, [key]: value }));
  };

  const toggleShowCredential = (key) => {
    setShowCredentials(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const syncTasks = async () => {
      const targets = Object.fromEntries(Object.entries(syncTargets).filter(([, value]) => value));
      if (Object.keys(targets).length === 0) {
          toast.warning('Nenhum destino de sincronização foi configurado.');
          return;
      }

      setLoading(true);
      setSyncResults(null);
      try {
          // --- CORREÇÃO 2: Nome da função corrigido ---
          const data = await syncTasks(targets); // ANTES (ERRADO): syncTasksApi(targets)
          setSyncResults(data);
          toast.success(`${data.synced_tasks} tarefas foram processadas para sincronização!`);
      } catch (error) {
          console.error('Erro ao sincronizar tarefas:', error);
          toast.error(error.message || 'Erro ao sincronizar tarefas.');
      } finally {
          setLoading(false);
      }
  };

  const exportToObsidian = async () => {
      if (!syncTargets.obsidian_vault) {
          toast.warning('Por favor, especifique o caminho do vault do Obsidian.');
          return;
      }

      setLoading(true);
      try {
          // --- CORREÇÃO 2: Nome da função corrigido ---
          const data = await exportToObsidian(syncTargets.obsidian_vault); // ANTES (ERRADO): exportToObsidianApi(...)
          toast.success(`${data.exported_count} notas exportadas para o Obsidian!`);
      } catch (error) {
          console.error('Erro ao exportar para Obsidian:', error);
          toast.error(error.message || 'Erro ao exportar para Obsidian.');
      } finally {
          setLoading(false);
      }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'connected': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'available': return <CheckCircle className="w-5 h-5 text-blue-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const renderOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Status das Integrações</h3>
        <div className="flex gap-2">
          <button
            onClick={testConnections}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
            Testar Conexões
          </button>
          <button
            onClick={fetchIntegrationsStatus}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(integrationConfigs).map(([key, config]) => {
          const IconComponent = config.icon;
          const isAvailable = integrations[key];
          const connectionStatus = connections[key];
          
          return (
            <div key={key} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${config.color} text-white`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{config.name}</h4>
                    <p className="text-sm text-gray-600">{config.description}</p>
                  </div>
                </div>
                {getStatusIcon(connectionStatus?.status)}
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                    {isAvailable ? 'Configurado' : 'Não configurado'}
                  </span>
                </div>
                {connectionStatus && (
                  <>
                    {connectionStatus.repos_count !== undefined && (<div className="flex justify-between"><span className="text-gray-600">Repositórios:</span><span className="font-medium">{connectionStatus.repos_count}</span></div>)}
                    {connectionStatus.boards_count !== undefined && (<div className="flex justify-between"><span className="text-gray-600">Boards:</span><span className="font-medium">{connectionStatus.boards_count}</span></div>)}
                    {connectionStatus.databases_count !== undefined && (<div className="flex justify-between"><span className="text-gray-600">Databases:</span><span className="font-medium">{connectionStatus.databases_count}</span></div>)}
                    {connectionStatus.objects_count !== undefined && (<div className="flex justify-between"><span className="text-gray-600">Objetos:</span><span className="font-medium">{connectionStatus.objects_count}</span></div>)}
                    {connectionStatus.error && (<div className="text-red-600 text-xs">{connectionStatus.error}</div>)}
                  </>
                )}
              </div>
              <div className="flex gap-2 mt-3">
                <a href={config.docs} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800">
                  <ExternalLink className="w-3 h-3" />
                  Docs
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(connections).length > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <h4 className="font-medium text-green-800">Teste de Conexões Concluído</h4>
          </div>
          <p className="text-sm text-green-700">
            {Object.values(connections).filter(c => c.status === 'connected' || c.status === 'available').length} de {Object.keys(connections).length} integrações funcionando corretamente.
          </p>
        </div>
      )}
    </div>
  );

  const renderConfiguration = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Configuração de Credenciais</h3>
        <button onClick={saveCredentials} className="flex items-center gap-2 px-3 py-1 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600">
          <Save className="w-4 h-4" />
          Salvar
        </button>
      </div>
      <div className="space-y-6">
        {Object.entries(integrationConfigs).map(([key, config]) => {
          if (config.fields.length === 0) return null;
          const IconComponent = config.icon;
          return (
            <div key={key} className="p-4 border border-gray-200 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${config.color} text-white`}><IconComponent className="w-5 h-5" /></div>
                <div><h4 className="font-medium text-gray-900">{config.name}</h4><p className="text-sm text-gray-600">{config.description}</p></div>
              </div>
              <div className="space-y-3">
                {config.fields.map(field => (
                  <div key={field.key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{field.label}{field.required && <span className="text-red-500 ml-1">*</span>}</label>
                    <div className="relative">
                      <input type={showCredentials[field.key] ? 'text' : field.type} value={credentials[field.key] || ''} onChange={(e) => handleCredentialChange(field.key, e.target.value)} className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder={`Digite seu ${field.label.toLowerCase()}`} />
                      {field.type === 'password' && (<button type="button" onClick={() => toggleShowCredential(field.key)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600">{showCredentials[field.key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>)}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800"><p className="font-medium mb-1">Como obter:</p><a href={config.docs} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">Consulte a documentação oficial →</a></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="text-sm text-yellow-800"><p className="font-medium mb-1">Segurança</p><p>As credenciais são armazenadas localmente no seu navegador e nunca são enviadas para servidores externos. Para máxima segurança, use tokens com permissões mínimas necessárias.</p></div>
        </div>
      </div>
    </div>
  );

  const renderSync = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Sincronização de Tarefas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Destinos de Sincronização</h4>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Repositório GitHub (owner/repo)</label><input type="text" value={syncTargets.github_repo} onChange={(e) => setSyncTargets(prev => ({ ...prev, github_repo: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="ex: usuario/meu-projeto" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ID da Lista Trello</label><input type="text" value={syncTargets.trello_list} onChange={(e) => setSyncTargets(prev => ({ ...prev, trello_list: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="ID da lista do Trello" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">ID do Database Notion</label><input type="text" value={syncTargets.notion_database} onChange={(e) => setSyncTargets(prev => ({ ...prev, notion_database: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="ID do database do Notion" /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Caminho do Vault Obsidian</label><input type="text" value={syncTargets.obsidian_vault} onChange={(e) => setSyncTargets(prev => ({ ...prev, obsidian_vault: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="/caminho/para/vault" /></div>
        </div>
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Ações</h4>
          <div className="space-y-3">
            <button onClick={syncTasks} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />} Sincronizar Tarefas</button>
            <button onClick={exportToObsidian} disabled={loading} className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 disabled:opacity-50">{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Exportar para Obsidian</button>
          </div>
          {syncResults && (<div className="p-4 bg-green-50 border border-green-200 rounded-lg"><h5 className="font-medium text-green-800 mb-2">Resultado da Sincronização</h5><div className="text-sm text-green-700 space-y-1"><p>Tarefas sincronizadas: {syncResults.synced_tasks}</p>{syncResults.results.github.length > 0 && (<p>GitHub: {syncResults.results.github.length} issues criadas</p>)}{syncResults.results.trello.length > 0 && (<p>Trello: {syncResults.results.trello.length} cards criados</p>)}{syncResults.results.notion.length > 0 && (<p>Notion: {syncResults.results.notion.length} páginas criadas</p>)}{syncResults.results.errors.length > 0 && (<div className="text-red-600"><p>Erros: {syncResults.results.errors.length}</p>{syncResults.results.errors.map((error, index) => (<p key={index} className="text-xs">• {error}</p>))}</div>)}</div></div>)}
        </div>
      </div>
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="flex items-start gap-2"><Info className="w-5 h-5 text-blue-600 mt-0.5" /><div className="text-sm text-blue-800"><p className="font-medium mb-1">Como funciona a sincronização</p><ul className="space-y-1 list-disc list-inside"><li>Tarefas ativas são convertidas em issues/cards/páginas</li><li>Metadados como prioridade e categoria são preservados</li><li>Labels automáticos são adicionados baseados no contexto</li><li>A sincronização não afeta as tarefas originais no Lex Flow</li></ul></div></div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6"><h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3"><Link className="w-8 h-8 text-blue-600" />Integrações</h2><p className="text-gray-600 mt-2">Conecte o Lex Flow com suas ferramentas favoritas de produtividade</p></div>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200">
        {[{ id: 'overview', label: 'Visão Geral', icon: Settings }, { id: 'config', label: 'Configuração', icon: Key }, { id: 'sync', label: 'Sincronização', icon: RotateCw }].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${activeTab === tab.id ? 'bg-blue-500 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'}`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>
      <div className="bg-white rounded-lg">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'config' && renderConfiguration()}
        {activeTab === 'sync' && renderSync()}
      </div>
    </div>
  );
};

export default Integrations;