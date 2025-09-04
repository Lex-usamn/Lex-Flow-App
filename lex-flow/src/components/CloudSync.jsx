import { toast } from 'sonner';
import { 
    getCloudProviders, 
    getCloudConnections, 
    getCloudSyncStatus, 
    connectCloudProvider, 
    disconnectCloudProvider, 
    syncWithProvider 
} from '../utils/api';
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Cloud, 
  Check, 
  CloudOff, 
  Settings, 
  RefreshCw, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  Clock,
  ExternalLink
} from 'lucide-react';

const CloudSync = () => {
  const [providers, setProviders] = useState([]);
  const [connections, setConnections] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState({});

useEffect(() => {
        // Carrega todos os dados iniciais de uma vez
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // Executa as chamadas em paralelo para mais eficiência
                const [providersRes, connectionsRes, statusRes] = await Promise.all([
                    getCloudProviders(),
                    getCloudConnections(),
                    getCloudSyncStatus()
                ]);
                
                setProviders(providersRes.providers || []);
                setConnections(connectionsRes.connections || []);
                setSyncStatus(statusRes.sync_status || null);

            } catch (error) {
                console.error("Erro ao carregar dados de Cloud Sync:", error);
                toast.error("Não foi possível carregar os dados de sincronização.");
            } finally {
                setLoading(false);
            }
        };
        
        loadInitialData();
    }, []);

const handleConnectProvider = async (providerId) => {
        try {
            setLoading(true);
            const data = await connectCloudProvider(providerId);

            if (data.auth_url) {
                const authWindow = window.open(data.auth_url, 'oauth', 'width=600,height=600');
                
                const checkClosed = setInterval(async () => {
                    if (authWindow.closed) {
                        clearInterval(checkClosed);
                        toast.info("Verificando status da conexão...");
                        // Recarregar conexões após autorização
                        const connectionsRes = await getCloudConnections();
                        setConnections(connectionsRes.connections || []);
                        const statusRes = await getCloudSyncStatus();
                        setSyncStatus(statusRes.sync_status || null);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Erro ao conectar provedor:', error);
            toast.error(error.message || "Não foi possível iniciar a conexão.");
        } finally {
            setLoading(false);
        }
    };

    const handleSyncWithProvider = async (providerId) => {
        try {
            setSyncing(prev => ({ ...prev, [providerId]: true }));
            await syncWithProvider(providerId);
            
            // Recarrega os dados para mostrar o novo status
            const connectionsRes = await getCloudConnections();
            setConnections(connectionsRes.connections || []);
            const statusRes = await getCloudSyncStatus();
            setSyncStatus(statusRes.sync_status || null);
            toast.success("Sincronização iniciada com sucesso!");

        } catch (error) {
            console.error('Erro ao sincronizar:', error);
            toast.error(error.message || "Erro durante a sincronização.");
        } finally {
            setSyncing(prev => ({ ...prev, [providerId]: false }));
        }
    };

    const handleDisconnectProvider = async (providerId) => {
        if (window.confirm("Você tem certeza que deseja desconectar este provedor?")) {
            try {
                await disconnectCloudProvider(providerId);
                // Recarrega os dados para remover a conexão da UI
                const connectionsRes = await getCloudConnections();
                setConnections(connectionsRes.connections || []);
                const statusRes = await getCloudSyncStatus();
                setSyncStatus(statusRes.sync_status || null);
                toast.info("Provedor desconectado.");
            } catch (error) {
                console.error('Erro ao desconectar provedor:', error);
                toast.error(error.message || "Não foi possível desconectar.");
            }
        }
    };

  const getProviderIcon = (providerId) => {
    const icons = {
      google_drive: '🔵',
      dropbox: '🔷',
      onedrive: '🟦'
    };
    return icons[providerId] || '☁️';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'syncing':
        return 'bg-blue-100 text-blue-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatLastSync = (lastSync) => {
    if (!lastSync) return 'Nunca';
    const date = new Date(lastSync);
    return date.toLocaleString('pt-BR');
  };

  const connectedProviders = connections.reduce((acc, conn) => {
    acc[conn.provider] = conn;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sincronização em Nuvem
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Mantenha seus dados seguros e sincronizados
          </p>
        </div>
        <Button
          onClick={() => {
            loadConnections();
            loadSyncStatus();
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status Geral */}
      {syncStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="h-5 w-5" />
              Status da Sincronização
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {syncStatus.total_providers}
                </div>
                <div className="text-sm text-gray-600">
                  Provedores Configurados
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {syncStatus.active_syncs}
                </div>
                <div className="text-sm text-gray-600">
                  Sincronizações Ativas
                </div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Última Sincronização
                </div>
                <div className="font-medium">
                  {formatLastSync(syncStatus.last_sync)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Provedores Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map((provider) => {
          const connection = connectedProviders[provider.id];
          const isConnected = !!connection;
          const isSyncing = syncing[provider.id];

          return (
            <Card key={provider.id} className="relative">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {getProviderIcon(provider.id)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {provider.name}
                      </CardTitle>
                      <CardDescription>
                        {provider.description}
                      </CardDescription>
                    </div>
                  </div>
                  {isConnected && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Check className="h-3 w-3 mr-1" />
                      Conectado
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status da Conexão */}
                {isConnected && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(connection.sync_status)}
                        <Badge className={getStatusColor(connection.sync_status)}>
                          {connection.sync_status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Última Sync:</span>
                      <span className="text-sm font-medium">
                        {formatLastSync(connection.last_sync)}
                      </span>
                    </div>

                    {connection.sync_enabled && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Auto-sync:</span>
                        <Badge variant="outline" className="text-green-600">
                          Ativo
                        </Badge>
                      </div>
                    )}
                  </div>
                )}

                {/* Recursos */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Recursos:
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {provider.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Ações */}
                <div className="flex gap-2">
                  {!isConnected ? (
                    <Button
                      onClick={() => handleConnectProvider(provider.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Cloud className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleSyncWithProvider(provider.id)}
                        disabled={isSyncing}
                        variant="outline"
                        className="flex-1"
                      >
                        {isSyncing ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4 mr-2" />
                        )}
                        {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                      </Button>
                      <Button
                        onClick={() => handleDisconnectProvider(provider.id)}
                        variant="outline"
                        size="sm"
                      >
                        <CloudOff className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Informações Adicionais */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Privacidade:</strong> Seus dados são criptografados antes de serem enviados para a nuvem. 
          Apenas você tem acesso às suas informações sincronizadas.
        </AlertDescription>
      </Alert>

      {/* Configurações Avançadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações de Sincronização
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Frequência de Backup
              </label>
              <select className="w-full p-2 border rounded-md">
                <option value="manual">Manual</option>
                <option value="hourly">A cada hora</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Itens para Sincronizar
              </label>
              <div className="space-y-1">
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Tarefas e Projetos</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Anotações</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" defaultChecked />
                  <span className="text-sm">Configurações</span>
                </label>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline">
              Salvar Configurações
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CloudSync;

