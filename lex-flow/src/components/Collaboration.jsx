import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { 
  Users, 
  Plus, 
  Share2, 
  MessageSquare, 
  UserPlus, 
  Settings,
  Crown,
  Shield,
  Eye,
  Edit3,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  MoreHorizontal
} from 'lucide-react';
import io from 'socket.io-client';
// ...
import { toast } from 'sonner';
// Adicione estas linhas
import { getProjects, createProject, getProjectDetails, inviteCollaborator, addCommentToTask } from '../utils/api';
import { getToken } from '../utils/auth'; // Para o socket
// ...

const Collaboration = () => {
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [collaborators, setCollaborators] = useState([]);
  const [comments, setComments] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Estados para formulários
  const [showNewProject, setShowNewProject] = useState(false);
  const [showInviteUser, setShowInviteUser] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', description: '' });
  const [inviteEmail, setInviteEmail] = useState('');
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    loadProjects();
    initializeSocket();
    
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (selectedProject && socket) {
      joinProjectRoom(selectedProject.id);
      loadProjectDetails(selectedProject.id);
    }
  }, [selectedProject, socket]);

const initializeSocket = () => {
        const token = getToken(); // Usa a função segura para pegar o token
        if (!token) return;

        const newSocket = io('http://localhost:5000', { // Use uma variável de ambiente para a URL em produção
            auth: { token }
        });

        newSocket.on('connect', () => console.log('Conectado ao servidor de colaboração'));
        
        newSocket.on('comment_added', (data) => {
            // A UI é atualizada quando o backend emite o evento para todos na sala
            console.log('Novo comentário recebido:', data);
            setComments(prev => [...prev, data.comment]);
        });
        
        newSocket.on('active_users', (data) => setActiveUsers(data.users));

        setSocket(newSocket);
    };

    const joinProjectRoom = (projectId) => {
        if (socket) {
            // O backend já sabe quem é o usuário pela autenticação do socket
            socket.emit('join_project', { project_id: projectId });
        }
    };

    const loadProjects = async () => {
        try {
            setLoading(true);
            const response = await getProjects();
            setProjects(response.projects);
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            toast.error("Não foi possível carregar os projetos.");
        } finally {
            setLoading(false);
        }
    };

    const loadProjectDetails = async (projectId) => {
        try {
            const response = await getProjectDetails(projectId);
            setCollaborators(response.project.collaborators || []);
            // Assumindo que a API retorna comentários de todas as tarefas do projeto
            const allComments = response.project.tasks.flatMap(task => task.comments || []);
            setComments(allComments);
        } catch (error) {
            console.error('Erro ao carregar detalhes do projeto:', error);
            toast.error("Não foi possível carregar os detalhes do projeto.");
        }
    };

    const handleCreateProject = async () => {
        try {
            const response = await createProject(newProject);
            setProjects(prev => [...prev, response.project]);
            setNewProject({ name: '', description: '' });
            setShowNewProject(false);
            toast.success(`Projeto "${response.project.name}" criado!`);
        } catch (error) {
            console.error('Erro ao criar projeto:', error);
            toast.error(error.message || "Não foi possível criar o projeto.");
        }
    };

    const handleInviteCollaborator = async () => {
        if (!selectedProject || !inviteEmail) return;

        try {
            await inviteCollaborator(selectedProject.id, inviteEmail);
            setInviteEmail('');
            setShowInviteUser(false);
            toast.success("Convite enviado com sucesso!");
            // Recarrega os detalhes para mostrar o novo colaborador pendente
            loadProjectDetails(selectedProject.id);
        } catch (error) {
            console.error('Erro ao convidar colaborador:', error);
            toast.error(error.message || "Não foi possível enviar o convite.");
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !selectedProject) return;

        // Lógica de exemplo: adiciona o comentário à primeira tarefa do projeto
        const firstTaskId = selectedProject.tasks?.[0]?.id;
        if (!firstTaskId) {
            toast.warning("Este projeto não tem tarefas para adicionar comentários.");
            return;
        }

        try {
            // A chamada de API salva o comentário no banco de dados.
            // O backend então emitirá o evento 'comment_added' via socket,
            // que será capturado pelo listener no useEffect para atualizar a UI de todos.
            await addCommentToTask(selectedProject.id, firstTaskId, { content: newComment });
            setNewComment('');
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            toast.error("Não foi possível adicionar o comentário.");
        }
    };

  const updateActiveUsers = () => {
    // Atualizar lista de usuários ativos
    // Implementar lógica específica se necessário
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-4 w-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'member':
        return <Edit3 className="h-4 w-4 text-green-500" />;
      case 'viewer':
        return <Eye className="h-4 w-4 text-gray-500" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'owner':
        return 'bg-yellow-100 text-yellow-800';
      case 'admin':
        return 'bg-blue-100 text-blue-800';
      case 'member':
        return 'bg-green-100 text-green-800';
      case 'viewer':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Colaboração
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Trabalhe em equipe em projetos compartilhados
          </p>
        </div>
        <Button onClick={() => setShowNewProject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de Projetos */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Meus Projetos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {loading ? (
                <div className="text-center py-4">Carregando...</div>
              ) : projects.length === 0 ? (
                <div className="text-center py-4 text-gray-500">
                  Nenhum projeto encontrado
                </div>
              ) : (
                projects.map((project) => (
                  <div
                    key={project.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedProject?.id === project.id
                        ? 'bg-blue-50 border-blue-200'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedProject(project)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{project.name}</h4>
                        <p className="text-sm text-gray-600 truncate">
                          {project.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {getRoleIcon(project.role)}
                        <Badge className={getRoleBadgeColor(project.role)}>
                          {project.role}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>{project.task_count || 0} tarefas</span>
                      <span>{project.collaborator_count || 0} colaboradores</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detalhes do Projeto */}
        <div className="lg:col-span-2">
          {selectedProject ? (
            <div className="space-y-6">
              {/* Informações do Projeto */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedProject.name}</CardTitle>
                      <CardDescription>{selectedProject.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowInviteUser(true)}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Convidar
                      </Button>
                      <Button variant="outline" size="sm">
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Usuários Ativos */}
              {activeUsers.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Usuários Online</span>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {activeUsers.map((user) => (
                        <Badge key={user.user_id} variant="outline" className="flex items-center gap-1">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          {user.user_name}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Colaboradores */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Colaboradores ({collaborators.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {collaborator.user?.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium">{collaborator.user?.username}</div>
                            <div className="text-sm text-gray-600">{collaborator.user?.email}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getRoleBadgeColor(collaborator.role)}>
                            {collaborator.role}
                          </Badge>
                          {collaborator.status === 'pending' && (
                            <Badge variant="outline" className="text-yellow-600">
                              Pendente
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Comentários e Discussões */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Discussões do Projeto
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Lista de Comentários */}
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {comments.length === 0 ? (
                      <div className="text-center py-4 text-gray-500">
                        Nenhuma discussão ainda. Seja o primeiro a comentar!
                      </div>
                    ) : (
                      comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-blue-600">
                              {comment.user_name?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{comment.user_name}</span>
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{comment.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Novo Comentário */}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Adicione um comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      className="flex-1"
                      rows={2}
                    />
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      size="sm"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecione um Projeto
                  </h3>
                  <p className="text-gray-600">
                    Escolha um projeto da lista para ver os detalhes e colaborar
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modal: Novo Projeto */}
      {showNewProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Criar Novo Projeto</CardTitle>
              <CardDescription>
                Crie um projeto para colaborar com sua equipe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nome do Projeto</label>
                <Input
                  value={newProject.name}
                  onChange={(e) => setNewProject(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Digite o nome do projeto"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <Textarea
                  value={newProject.description}
                  onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o projeto"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowNewProject(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreateProject}
                  disabled={!newProject.name.trim()}
                >
                  Criar Projeto
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Convidar Usuário */}
      {showInviteUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Convidar Colaborador</CardTitle>
              <CardDescription>
                Convide alguém para colaborar no projeto "{selectedProject?.name}"
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email do Colaborador</label>
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="Digite o email"
                />
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  O usuário receberá um convite e poderá aceitar para começar a colaborar.
                </AlertDescription>
              </Alert>
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowInviteUser(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleInviteCollaborator}
                  disabled={!inviteEmail.trim()}
                >
                  Enviar Convite
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Collaboration;

