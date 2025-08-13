import { useState, useEffect } from 'react'
import { Plus, Trash2, Star, GripVertical, CheckCircle, Circle } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

const taskCategories = {
  priority: { label: 'Prioridade', icon: '🎯', color: 'border-red-200 bg-red-50 dark:bg-red-950/20' },
  technical: { label: 'Técnica', icon: '📌', color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' },
  study: { label: 'Estudo', icon: '📚', color: 'border-green-200 bg-green-50 dark:bg-green-950/20' }
}

function TaskManager() {
  const [tasks, setTasks] = useState([])
  const [newTask, setNewTask] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('priority')
  const [draggedTask, setDraggedTask] = useState(null)

  useEffect(() => {
    const savedTasks = JSON.parse(localStorage.getItem('lex-flow-tasks') || '[]')
    setTasks(savedTasks)
  }, [])

  useEffect(() => {
    localStorage.setItem('lex-flow-tasks', JSON.stringify(tasks))
    
    // Atualizar prioridades no localStorage
    const priorities = tasks
      .filter(task => task.category === 'priority')
      .slice(0, 3)
    localStorage.setItem('lex-flow-priorities', JSON.stringify(priorities))
  }, [tasks])

  const addTask = () => {
    if (newTask.trim()) {
      const task = {
        id: Date.now(),
        text: newTask.trim(),
        category: selectedCategory,
        completed: false,
        createdAt: new Date().toISOString()
      }
      setTasks([...tasks, task])
      setNewTask('')
    }
  }

  const toggleTask = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, completed: !task.completed } : task
    ))
  }

  const deleteTask = (id) => {
    setTasks(tasks.filter(task => task.id !== id))
  }

  const handleDragStart = (e, task) => {
    setDraggedTask(task)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e, targetTask) => {
    e.preventDefault()
    if (!draggedTask || draggedTask.id === targetTask.id) return

    const draggedIndex = tasks.findIndex(task => task.id === draggedTask.id)
    const targetIndex = tasks.findIndex(task => task.id === targetTask.id)

    const newTasks = [...tasks]
    newTasks.splice(draggedIndex, 1)
    newTasks.splice(targetIndex, 0, draggedTask)

    setTasks(newTasks)
    setDraggedTask(null)
  }

  const markAsPriority = (id) => {
    setTasks(tasks.map(task => 
      task.id === id ? { ...task, category: 'priority' } : task
    ))
  }

  const getTasksByCategory = (category) => {
    return tasks.filter(task => task.category === category)
  }

  const TaskItem = ({ task }) => (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, task)}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, task)}
      className={`
        group flex items-center gap-3 p-3 border rounded-lg cursor-move transition-all
        ${task.completed ? 'opacity-60' : ''}
        ${taskCategories[task.category].color}
        hover:shadow-sm
      `}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => toggleTask(task.id)}
        className="p-0 h-auto"
      >
        {task.completed ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </Button>

      <span className="text-lg">{taskCategories[task.category].icon}</span>
      
      <span className={`flex-1 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
        {task.text}
      </span>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {task.category !== 'priority' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAsPriority(task.id)}
            className="p-1 h-auto"
            title="Marcar como prioridade"
          >
            <Star className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => deleteTask(task.id)}
          className="p-1 h-auto text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">✅ Gerenciador de Tarefas</h2>
        <p className="text-muted-foreground">Organize suas tarefas por categoria e prioridade</p>
      </div>

      {/* Formulário para nova tarefa */}
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
              onChange={(e) => setNewTask(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTask()}
              placeholder="Digite sua nova tarefa..."
              className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button onClick={addTask} disabled={!newTask.trim()}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Lista de tarefas por categoria */}
      {Object.entries(taskCategories).map(([categoryKey, category]) => {
        const categoryTasks = getTasksByCategory(categoryKey)
        
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
        )
      })}

      {/* Estatísticas */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Estatísticas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{tasks.length}</div>
            <div className="text-sm text-muted-foreground">Total de Tarefas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {tasks.filter(task => task.completed).length}
            </div>
            <div className="text-sm text-muted-foreground">Concluídas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-500">
              {tasks.filter(task => !task.completed).length}
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
  )
}

export default TaskManager

