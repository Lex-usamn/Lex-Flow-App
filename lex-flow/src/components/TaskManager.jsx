// src/components/TaskManager.jsx

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Star, GripVertical, CheckCircle, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
// IMPORTANTE: Importe as funções da sua API. Os nomes devem corresponder ao seu api.js
import { getTasksForProject, createTask, updateTask, deleteTask } from '../utils/api';

const taskCategories = {
  priority: { label: 'Prioridade', icon: '🎯', color: 'border-red-200 bg-red-50 dark:bg-red-950/20' },
  technical: { label: 'Técnica', icon: '📌', color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' },
  study: { label: 'Estudo', icon: '📚', color: 'border-green-200 bg-green-50 dark:bg-green-950/20' }
};

// O TaskManager agora precisa saber em qual projeto ele está.
// Você precisará passar o ID do projeto ativo como uma 'prop'.
// Ex: <TaskManager projectId={activeProjectId} />
function TaskManager({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [newTask, setNewTask] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('priority');
  const [draggedTask, setDraggedTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Efeito para buscar tarefas do backend quando o componente carrega ou o projeto muda
  useEffect(() => {
    // Não faz nada se nenhum projeto for selecionado
    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        // A API retorna o objeto do projeto, que contém a lista de tarefas
        const response = await getTasksForProject(projectId);
        setTasks(response.project.tasks || []);
      } catch (err) {
        console.error("Falha ao carregar tarefas:", err);
        setError('Não foi possível carregar as tarefas. Tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [projectId]);

  // --- Funções que agora interagem com a API ---

  const handleAddTask = async () => {
    if (!newTask.trim() || !projectId) return;

    const taskData = {
      title: newTask.trim(),
      category: selectedCategory,
      // outros campos como 'status', 'priority' podem ser adicionados aqui
      // O backend provavelmente definirá um status padrão como 'pending'
    };

    try {
      const response = await createTask(projectId, taskData);
      setTasks([...tasks, response.task]); // Adiciona a nova tarefa retornada pela API
      setNewTask('');
    } catch (err) {
      console.error("Falha ao adicionar tarefa:", err);
      setError('Não foi possível adicionar a tarefa.');
    }
  };

  const handleToggleTask = async (taskId) => {
    const task = tasks.find(currentTask => currentTask.id === taskId);
    if (!task) return;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';

    try {
      const response = await updateTask(projectId, taskId, { status: newStatus });
      setTasks(tasks.map(currentTask => (currentTask.id === taskId ? response.task : currentTask)));
    } catch (err) {
      console.error("Falha ao atualizar tarefa:", err);
      setError('Não foi possível atualizar a tarefa.');
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await deleteTask(projectId, taskId);
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (err) {
      console.error("Falha ao deletar tarefa:", err);
      setError('Não foi possível deletar a tarefa.');
    }
  };

  const handleMarkAsPriority = async (taskId) => {
    try {
      const response = await updateTask(projectId, taskId, { category: 'priority' });
      setTasks(tasks.map(currentTask => (currentTask.id === taskId ? response.task : currentTask)));
    } catch (err) {
      console.error("Falha ao mover para prioridade:", err);
      setError('Não foi possível alterar a categoria.');
    }
  };

  // --- Funções de arrastar e soltar (lógica de UI, não precisa de API) ---

  const handleDragStart = (event, task) => {
    setDraggedTask(task);
    event.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event, targetTask) => {
    event.preventDefault();
    if (!draggedTask || draggedTask.id === targetTask.id) return;

    const draggedIndex = tasks.findIndex(task => task.id === draggedTask.id);
    const targetIndex = tasks.findIndex(task => task.id === targetTask.id);

    const newTasks = [...tasks];
    // Remove o item arrastado de sua posição original
    newTasks.splice(draggedIndex, 1);
    // Insere o item arrastado na nova posição
    newTasks.splice(targetIndex, 0, draggedTask);

    setTasks(newTasks);
    setDraggedTask(null);
    // Opcional: Você pode querer salvar a nova ordem no backend aqui.
    // Ex: await saveTaskOrder(projectId, newTasks.map(task => task.id));
  };

  const getTasksByCategory = (category) => {
    return tasks.filter(task => task.category === category);
  };
  
  // --- A parte visual (JSX) do seu componente ---

  if (loading) {
    return <div>Carregando tarefas...</div>;
  }

  if (error) {
    return <div className="text-red-500 text-center">{error}</div>;
  }
  
  // Renderiza uma mensagem caso nenhum projeto tenha sido selecionado ainda
  if (!projectId) {
      return (
          <div className="text-center py-10 text-muted-foreground">
              <h2 className="text-2xl font-bold mb-2">✅ Gerenciador de Tarefas</h2>
              <p>Selecione um projeto para ver suas tarefas.</p>
          </div>
      );
  }

  // Componente interno para renderizar cada item da lista de tarefas
  const TaskItem = ({ task }) => (
    <div
      draggable
      onDragStart={(event) => handleDragStart(event, task)}
      onDragOver={handleDragOver}
      onDrop={(event) => handleDrop(event, task)}
      className={`
        group flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all
        ${task.status === 'completed' ? 'opacity-60' : ''}
        ${taskCategories[task.category]?.color || 'border-gray-200 bg-gray-50 dark:bg-gray-950/20'}
        hover:shadow-sm
      `}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleToggleTask(task.id)}
        className="p-0 h-auto"
      >
        {task.status === 'completed' ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      <span className="text-lg">{taskCategories[task.category]?.icon || '📝'}</span>
      
      <span className={`flex-1 ${task.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
        {task.title} {/* O campo agora é 'title' vindo da API */}
      </span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.category !== 'priority' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleMarkAsPriority(task.id)}
            className="p-1 h-auto"
            title="Marcar como prioridade"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleDeleteTask(task.id)}
          className="p-1 h-auto text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">✅ Gerenciador de Tarefas</h2>
        <p className="text-muted-foreground">Organize suas tarefas por categoria e prioridade</p>
      </div>

      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">➕ Nova Tarefa</h3>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            {Object.entries(taskCategories).map(([key, category]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className="gap-2"
              >
                <span>{category.icon}</span>
                {category.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              onKeyPress={(event) => event.key === 'Enter' && handleAddTask()}
              placeholder="Digite sua nova tarefa..."
              className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={handleAddTask} disabled={!newTask.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {Object.entries(taskCategories).map(([categoryKey, category]) => {
        const categoryTasks = getTasksByCategory(categoryKey);
        
        return (
          <div key={categoryKey} className="bg-card border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{category.icon}</span>
              <h3 className="text-lg font-semibold">{category.label}</h3>
              <span className="text-sm text-muted-foreground">
                ({categoryTasks.length} {categoryTasks.length === 1 ? 'tarefa' : 'tarefas'})
              </span>
            </div>

            {categoryTasks.length > 0 ? (
              <div className="space-y-2">
                {categoryTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-4xl mb-2">{category.icon}</div>
                <p>Nenhuma tarefa nesta categoria ainda.</p>
                <p className="text-sm">Adicione uma nova tarefa acima.</p>
              </div>
            )}
          </div>
        );
      })}

      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Estatísticas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{tasks.length}</div>
            <div className="text-sm text-muted-foreground">Total de Tarefas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {tasks.filter(task => task.status === 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Concluídas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {tasks.filter(task => task.status !== 'completed').length}
            </div>
            <div className="text-sm text-muted-foreground">Pendentes</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">
              {getTasksByCategory('priority').length}
            </div>
            <div className="text-sm text-muted-foreground">Prioridades</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TaskManager;