import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, CheckCircle, Circle, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
// CORREÇÃO: Importa as funções específicas da API
import { getStudyVideos, addStudyVideo, updateStudyVideo, deleteStudyVideo } from '../utils/api'
import { toast } from 'sonner'

function VideoStudy() {
    const [videos, setVideos] = useState([])
    const [newVideoUrl, setNewVideoUrl] = useState('')
    const [newVideoTitle, setNewVideoTitle] = useState('')
    const [selectedVideo, setSelectedVideo] = useState(null)
    const [videoNotes, setVideoNotes] = useState('')
    const [isLoading, setIsLoading] = useState(false) // Para o formulário de adicionar
    const [isFetching, setIsFetching] = useState(true) // Para o carregamento inicial

    // Efeito para carregar os vídeos do backend quando o componente é montado
    useEffect(() => {
        const fetchVideos = async () => {
            try {
                setIsFetching(true);
                const response = await getStudyVideos();
                setVideos(response.videos || []);
            } catch (error) {
                console.error("Erro ao carregar vídeos:", error);
                toast.error("Não foi possível carregar seus vídeos de estudo.");
            } finally {
                setIsFetching(false);
            }
        };
        fetchVideos();
    }, []);

    const addVideo = async () => {
        if (!newVideoUrl.trim() || !newVideoTitle.trim()) {
            toast.warning("Por favor, preencha o título e a URL do vídeo.");
            return;
        }
        
        setIsLoading(true);
        try {
            // A lógica de extrair ID e buscar metadados agora é do backend
            const videoData = {
                title: newVideoTitle.trim(),
                url: newVideoUrl.trim(),
            };
            const response = await addStudyVideo(videoData);
            setVideos([...videos, response.video]); // Adiciona o vídeo retornado pela API
            setNewVideoUrl('');
            setNewVideoTitle('');
            toast.success("Vídeo adicionado com sucesso!");
        } catch (error) {
            console.error('Erro ao adicionar vídeo:', error);
            toast.error(error.message || 'Erro ao adicionar vídeo. Verifique a URL.');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleWatched = async (id) => {
        const video = videos.find(v => v.id === id);
        if (!video) return;

        const newWatchedStatus = !video.watched;
        try {
            const response = await updateStudyVideo(id, { watched: newWatchedStatus });
            setVideos(videos.map(v => (v.id === id ? response.video : v)));
        } catch (error) {
            console.error("Erro ao atualizar status:", error);
            toast.error("Não foi possível atualizar o status do vídeo.");
        }
    };

    const deleteVideo = async (id) => {
        try {
            await deleteStudyVideo(id);
            setVideos(videos.filter(video => video.id !== id));
            if (selectedVideo && selectedVideo.id === id) {
                setSelectedVideo(null);
            }
            toast.info("Vídeo removido.");
        } catch (error) {
            console.error("Erro ao deletar vídeo:", error);
            toast.error("Não foi possível remover o vídeo.");
        }
    };

    const selectVideo = (video) => {
        setSelectedVideo(video);
        setVideoNotes(video.notes || '');
    };

    const saveNotes = async () => {
        if (selectedVideo) {
            try {
                const response = await updateStudyVideo(selectedVideo.id, { notes: videoNotes });
                setVideos(videos.map(video => 
                    video.id === selectedVideo.id ? response.video : video
                ));
                setSelectedVideo(response.video); // Atualiza o vídeo selecionado com os novos dados
                toast.success("Anotações salvas!");
            } catch (error) {
                console.error("Erro ao salvar anotações:", error);
                toast.error("Não foi possível salvar as anotações.");
            }
        }
    };

    const getEmbedUrl = (videoId) => `https://www.youtube.com/embed/${videoId}`;
    const getThumbnailUrl = (videoId) => `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;

    const watchedVideos = videos.filter(video => video.watched);
    const unwatchedVideos = videos.filter(video => !video.watched);

    if (isFetching) {
        return <div className="text-center p-10">Carregando seus vídeos de estudo...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">📚 Gestão de Estudos</h2>
                <p className="text-muted-foreground">Organize seus vídeos de estudo e faça anotações</p>
            </div>

            {/* Formulário para adicionar vídeo */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">➕ Adicionar Vídeo</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2">Título do Vídeo</label>
                        <input
                            type="text"
                            value={newVideoTitle}
                            onChange={(e) => setNewVideoTitle(e.target.value)}
                            placeholder="Ex: Curso de React - Aula 1"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">URL do YouTube</label>
                        <div className="flex gap-2">
                            <input
                                type="url"
                                value={newVideoUrl}
                                onChange={(e) => setNewVideoUrl(e.target.value)}
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="flex-1 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                                disabled={isLoading}
                            />
                            <Button onClick={addVideo} disabled={!newVideoUrl.trim() || !newVideoTitle.trim() || isLoading}>
                                {isLoading ? (
                                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                                ) : (
                                    <Plus className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Lista de Vídeos */}
                <div className="space-y-4">
                    {/* Vídeos não assistidos */}
                    <div className="bg-card border rounded-lg p-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Circle className="h-5 w-5 text-orange-500" />
                            Para Assistir ({unwatchedVideos.length})
                        </h3>
                        {unwatchedVideos.length > 0 ? (
                            <div className="space-y-3">
                                {unwatchedVideos.map(video => (
                                    <div key={video.id} className="group border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                                        <div className="flex gap-3">
                                            <img
                                                src={getThumbnailUrl(video.videoId)}
                                                alt={video.title}
                                                className="w-20 h-15 object-cover rounded cursor-pointer"
                                                onClick={() => selectVideo(video)}
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate">{video.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Adicionado em {new Date(video.addedAt).toLocaleDateString('pt-BR')}
                                                </p>
                                                {video.summary && (
                                                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                                        <p><strong>Canal:</strong> {video.summary.author}</p>
                                                        {video.summary.duration && (<p><strong>Duração:</strong> {video.summary.duration}</p>)}
                                                        {video.summary.description && (<p className="mt-1 line-clamp-2"><strong>Descrição:</strong> {video.summary.description}</p>)}
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    <Button variant="outline" size="sm" onClick={() => selectVideo(video)} className="gap-1">
                                                        <ExternalLink className="h-3 w-3" /> Assistir
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => toggleWatched(video.id)} className="gap-1">
                                                        <CheckCircle className="h-3 w-3" /> Marcar como Assistido
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => deleteVideo(video.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-muted-foreground">
                                <div className="text-4xl mb-2">📺</div>
                                <p>Nenhum vídeo para assistir.</p>
                                <p className="text-sm">Adicione um novo vídeo acima.</p>
                            </div>
                        )}
                    </div>

                    {/* Vídeos assistidos */}
                    {watchedVideos.length > 0 && (
                        <div className="bg-card border rounded-lg p-6">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-green-500" />
                                Assistidos ({watchedVideos.length})
                            </h3>
                            <div className="space-y-3">
                                {watchedVideos.map(video => (
                                    <div key={video.id} className="group border rounded-lg p-3 hover:bg-muted/50 transition-colors opacity-75">
                                        <div className="flex gap-3">
                                            <img src={getThumbnailUrl(video.videoId)} alt={video.title} className="w-20 h-15 object-cover rounded cursor-pointer" onClick={() => selectVideo(video)} />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium truncate line-through">{video.title}</h4>
                                                <p className="text-sm text-muted-foreground">Assistido ✓</p>
                                                {video.summary && (
                                                    <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                                                        <p><strong>Canal:</strong> {video.summary.author}</p>
                                                        {video.summary.duration && (<p><strong>Duração:</strong> {video.summary.duration}</p>)}
                                                        {video.summary.description && (<p className="mt-1 line-clamp-2"><strong>Descrição:</strong> {video.summary.description}</p>)}
                                                    </div>
                                                )}
                                                <div className="flex gap-2 mt-2">
                                                    <Button variant="outline" size="sm" onClick={() => selectVideo(video)} className="gap-1">
                                                        <StickyNote className="h-3 w-3" /> Ver Anotações
                                                    </Button>
                                                    <Button variant="outline" size="sm" onClick={() => toggleWatched(video.id)} className="gap-1">
                                                        <Circle className="h-3 w-3" /> Marcar como Não Assistido
                                                    </Button>
                                                    <Button variant="ghost" size="sm" onClick={() => deleteVideo(video.id)} className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Player e Anotações */}
                <div className="space-y-4">
                    {selectedVideo ? (
                        <>
                            <div className="bg-card border rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4">{selectedVideo.title}</h3>
                                <div className="aspect-video">
                                    <iframe src={getEmbedUrl(selectedVideo.videoId)} title={selectedVideo.title} className="w-full h-full rounded-lg" allowFullScreen />
                                </div>
                            </div>
                            <div className="bg-card border rounded-lg p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <StickyNote className="h-5 w-5" /> Anotações
                                </h3>
                                <textarea
                                    value={videoNotes}
                                    onChange={(e) => setVideoNotes(e.target.value)}
                                    placeholder="Faça suas anotações sobre este vídeo..."
                                    className="w-full h-40 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                                />
                                <div className="flex justify-end mt-3">
                                    <Button onClick={saveNotes}>Salvar Anotações</Button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="bg-card border rounded-lg p-6 text-center h-full flex flex-col justify-center">
                            <div className="text-4xl mb-4">🎬</div>
                            <h3 className="text-lg font-semibold mb-2">Selecione um vídeo</h3>
                            <p className="text-muted-foreground">Clique em um vídeo da lista para assistir e fazer anotações</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Estatísticas de Estudo</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-primary">{videos.length}</div>
                        <div className="text-sm text-muted-foreground">Total de Vídeos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{watchedVideos.length}</div>
                        <div className="text-sm text-muted-foreground">Assistidos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-500">{unwatchedVideos.length}</div>
                        <div className="text-sm text-muted-foreground">Pendentes</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{videos.filter(video => video.notes && video.notes.trim()).length}</div>
                        <div className="text-sm text-muted-foreground">Com Anotações</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default VideoStudy