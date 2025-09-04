import { useState, useEffect } from 'react'
import { Plus, Trash2, Search, Tag, Calendar, StickyNote, Target } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
// CORREÇÃO: Importa as funções específicas da API
import { getQuickNotes, addQuickNote, deleteQuickNote, convertNoteToTask } from '../utils/api'
import { toast } from 'sonner'

const noteCategories = {
    idea: { label: 'Ideia', icon: '💡', color: 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20' },
    task: { label: 'Tarefa', icon: '✅', color: 'border-blue-200 bg-blue-50 dark:bg-blue-950/20' },
    insight: { label: 'Insight', icon: '🧠', color: 'border-purple-200 bg-purple-50 dark:bg-purple-950/20' },
    learning: { label: 'Aprendizado', icon: '📚', color: 'border-green-200 bg-green-50 dark:bg-green-950/20' },
    general: { label: 'Geral', icon: '📝', color: 'border-gray-200 bg-gray-50 dark:bg-gray-950/20' }
}

function QuickNotes() {
    const [notes, setNotes] = useState([])
    const [newNote, setNewNote] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('general')
    const [searchTerm, setSearchTerm] = useState('')
    const [filterCategory, setFilterCategory] = useState('all')
    const [expandedNote, setExpandedNote] = useState(null)
    const [isLoading, setIsLoading] = useState(true)

    // Efeito para carregar as anotações do backend
    useEffect(() => {
        const fetchNotes = async () => {
            try {
                setIsLoading(true);
                const response = await getQuickNotes();
                // A API deve retornar um array de anotações
                setNotes(response.notes || []);
            } catch (error) {
                console.error("Erro ao carregar anotações:", error);
                toast.error("Não foi possível carregar suas anotações.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchNotes();
    }, []); // A dependência vazia [] garante que isso rode apenas uma vez

    const extractTags = (text) => {
        const tagRegex = /#(\w+)/g
        const matches = text.match(tagRegex)
        return matches ? matches.map(tag => tag.substring(1)) : []
    }

    const addNote = async () => {
        if (newNote.trim()) {
            const noteData = {
                content: newNote.trim(),
                category: selectedCategory,
                tags: extractTags(newNote)
            }
            try {
                const response = await addQuickNote(noteData);
                setNotes([response.note, ...notes]); // Adiciona a nova nota no topo da lista
                setNewNote('');
            } catch (error) {
                console.error("Erro ao adicionar anotação:", error);
                toast.error("Não foi possível salvar a anotação.");
            }
        }
    }

    const deleteNoteLocal = async (id) => {
        try {
            await deleteQuickNote(id);
            setNotes(notes.filter(note => note.id !== id));
            toast.info("Anotação removida.");
        } catch (error) {
            console.error("Erro ao deletar anotação:", error);
            toast.error("Não foi possível remover a anotação.");
        }
    }

    const convertToTaskLocal = async (note) => {
        try {
            // A API agora cuida de criar a tarefa e remover a anotação
            await convertNoteToTask(note.id);
            setNotes(notes.filter(n => n.id !== note.id));
            toast.success('Nota convertida em tarefa com sucesso!');
            // Idealmente, você também faria um refresh da lista de tarefas se ela estiver visível em outra parte da tela
        } catch (error) {
            console.error("Erro ao converter anotação:", error);
            toast.error("Não foi possível converter a anotação em tarefa.");
        }
    }

    const filteredNotes = notes.filter(note => {
        const matchesSearch = note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              (note.tags || []).some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesCategory = filterCategory === 'all' || note.category === filterCategory
        return matchesSearch && matchesCategory
    })

    const formatDate = (dateString) => {
        const date = new Date(dateString)
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit'
        })
    }

    const highlightTags = (text) => {
        return text.replace(/#(\w+)/g, '<span class="text-primary font-semibold">#$1</span>')
    }

    const getAllTags = () => {
        const allTags = notes.flatMap(note => note.tags || [])
        return [...new Set(allTags)]
    }

    const getNotesByCategory = (category) => {
        return notes.filter(note => note.category === category)
    }

    if (isLoading) {
        return <div className="text-center p-10">Carregando anotações...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">📝 Anotações Rápidas</h2>
                <p className="text-muted-foreground">Capture ideias, insights e tarefas rapidamente</p>
            </div>

            {/* Formulário para nova nota */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">➕ Nova Anotação</h3>
                <div className="space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        {Object.entries(noteCategories).map(([key, category]) => (
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
                        <textarea
                            value={newNote}
                            onChange={(e) => setNewNote(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && e.ctrlKey && addNote()}
                            placeholder="Digite sua anotação... (use #tags para organizar)"
                            className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            rows="3"
                        />
                        <Button onClick={addNote} disabled={!newNote.trim()} className="self-start">
                            <Plus className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        💡 Dica: Use Ctrl+Enter para adicionar rapidamente ou #tags para organizar
                    </p>
                </div>
            </div>

            {/* Filtros e Busca */}
            <div className="bg-card border rounded-lg p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar anotações ou tags..."
                                className="w-full pl-10 pr-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant={filterCategory === 'all' ? "default" : "outline"} size="sm" onClick={() => setFilterCategory('all')}>Todas</Button>
                        {Object.entries(noteCategories).map(([key, category]) => (
                            <Button key={key} variant={filterCategory === key ? "default" : "outline"} size="sm" onClick={() => setFilterCategory(key)} className="gap-1">
                                <span>{category.icon}</span>
                                {getNotesByCategory(key).length}
                            </Button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Lista de Anotações */}
            <div className="space-y-3">
                {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => {
                        const category = noteCategories[note.category]
                        const isExpanded = expandedNote === note.id
                        
                        return (
                            <div key={note.id} className={`${category.color} border rounded-lg p-4 group`}>
                                <div className="flex items-start gap-3">
                                    <span className="text-xl">{category.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-medium text-primary">{category.label}</span>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {formatDate(note.createdAt)}
                                            </span>
                                        </div>
                                        <div 
                                            className={`text-foreground ${isExpanded ? '' : 'line-clamp-3'} cursor-pointer`}
                                            onClick={() => setExpandedNote(isExpanded ? null : note.id)}
                                            dangerouslySetInnerHTML={{ __html: highlightTags(note.content) }}
                                        />
                                        {(note.tags || []).length > 0 && (
                                            <div className="flex gap-1 mt-2 flex-wrap">
                                                {note.tags.map(tag => (
                                                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                                                        <Tag className="h-3 w-3" />{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {note.category !== 'task' && (
                                            <Button variant="ghost" size="sm" onClick={() => convertToTaskLocal(note)} className="p-1 h-auto" title="Converter em tarefa">
                                                <Target className="h-4 w-4" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="sm" onClick={() => deleteNoteLocal(note.id)} className="p-1 h-auto text-red-500 hover:text-red-700">
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                ) : (
                    <div className="bg-card border rounded-lg p-8 text-center">
                        <StickyNote className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Nenhuma anotação encontrada</h3>
                        <p className="text-muted-foreground">
                            {searchTerm || filterCategory !== 'all' 
                                ? 'Tente ajustar os filtros de busca' 
                                : 'Comece adicionando sua primeira anotação acima'
                            }
                        </p>
                    </div>
                )}
            </div>

            {/* Tags Populares */}
            {getAllTags().length > 0 && (
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Tag className="h-5 w-5" /> Tags Populares
                    </h3>
                    <div className="flex gap-2 flex-wrap">
                        {getAllTags().slice(0, 10).map(tag => (
                            <Button key={tag} variant="outline" size="sm" onClick={() => setSearchTerm(`#${tag}`)} className="gap-1">
                                <Tag className="h-3 w-3" />{tag}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Estatísticas */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Estatísticas</h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {Object.entries(noteCategories).map(([key, category]) => {
                        const count = getNotesByCategory(key).length
                        return (
                            <div key={key} className="text-center">
                                <div className="text-2xl font-bold text-primary">{count}</div>
                                <div className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                                    <span>{category.icon}</span>
                                    {category.label}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default QuickNotes