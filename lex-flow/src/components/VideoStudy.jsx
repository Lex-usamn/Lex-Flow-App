import { useState, useEffect } from 'react'
import { Plus, Trash2, ExternalLink, CheckCircle, Circle, StickyNote } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

function VideoStudy() {
  const [videos, setVideos] = useState([])
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [selectedVideo, setSelectedVideo] = useState(null)
  const [videoNotes, setVideoNotes] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const savedVideos = JSON.parse(localStorage.getItem('lex-flow-videos') || '[]')
    setVideos(savedVideos)
  }, [])

  useEffect(() => {
    localStorage.setItem('lex-flow-videos', JSON.stringify(videos))
  }, [videos])

  const extractVideoId = (url) => {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    const match = url.match(regex)
    return match ? match[1] : null
  }

  const fetchVideoInfo = async (videoId) => {
    try {
      // Simular busca de informações do vídeo (em produção, usaria YouTube API)
      const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`)
      const data = await response.json()
      return {
        title: data.title || 'Título não disponível',
        description: data.description || 'Descrição não disponível',
        duration: data.duration || 'Duração não disponível',
        author: data.author_name || 'Autor não disponível'
      }
    } catch (error) {
      console.log('Erro ao buscar informações do vídeo:', error)
      return {
        title: 'Título não disponível',
        description: 'Descrição não disponível', 
        duration: 'Duração não disponível',
        author: 'Autor não disponível'
      }
    }
  }

  const addVideo = async () => {
    if (newVideoUrl.trim() && newVideoTitle.trim()) {
      const videoId = extractVideoId(newVideoUrl)
      if (videoId) {
        setIsLoading(true)
        try {
          // Buscar informações do vídeo
          const videoInfo = await fetchVideoInfo(videoId)
          
          const video = {
            id: Date.now(),
            title: newVideoTitle.trim(),
            url: newVideoUrl.trim(),
            videoId: videoId,
            watched: false,
            notes: '',
            addedAt: new Date().toISOString(),
            summary: {
              description: videoInfo.description,
              duration: videoInfo.duration,
              author: videoInfo.author
            }
          }
          setVideos([...videos, video])
          setNewVideoUrl('')
          setNewVideoTitle('')
        } catch (error) {
          console.error('Erro ao adicionar vídeo:', error)
          alert('Erro ao buscar informações do vídeo. Tente novamente.')
        } finally {
          setIsLoading(false)
        }
      } else {
        alert('Por favor, insira uma URL válida do YouTube')
      }
    }
  }

  const toggleWatched = (id) => {
    setVideos(videos.map(video => 
      video.id === id ? { ...video, watched: !video.watched } : video
    ))
  }

  const deleteVideo = (id) => {
    setVideos(videos.filter(video => video.id !== id))
    if (selectedVideo && selectedVideo.id === id) {
      setSelectedVideo(null)
    }
  }

  const selectVideo = (video) => {
    setSelectedVideo(video)
    setVideoNotes(video.notes || '')
  }

  const saveNotes = () => {
    if (selectedVideo) {
      setVideos(videos.map(video => 
        video.id === selectedVideo.id ? { ...video, notes: videoNotes } : video
      ))
      setSelectedVideo({ ...selectedVideo, notes: videoNotes })
    }
  }

  const getEmbedUrl = (videoId) => {
    return `https://www.youtube.com/embed/${videoId}`
  }

  const getThumbnailUrl = (videoId) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  }

  const watchedVideos = videos.filter(video => video.watched)
  const unwatchedVideos = videos.filter(video => !video.watched)

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
              <Button 
                onClick={addVideo} 
                disabled={!newVideoUrl.trim() || !newVideoTitle.trim() || isLoading}
              >
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
                        
                        {/* Resumo do vídeo */}
                        {video.summary && (
                          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                            <p><strong>Canal:</strong> {video.summary.author}</p>
                            {video.summary.duration && (
                              <p><strong>Duração:</strong> {video.summary.duration}</p>
                            )}
                            {video.summary.description && video.summary.description !== 'Descrição não disponível' && (
                              <p className="mt-1 line-clamp-2"><strong>Descrição:</strong> {video.summary.description}</p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectVideo(video)}
                            className="gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Assistir
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWatched(video.id)}
                            className="gap-1"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Marcar como Assistido
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVideo(video.id)}
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
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
                      <img
                        src={getThumbnailUrl(video.videoId)}
                        alt={video.title}
                        className="w-20 h-15 object-cover rounded cursor-pointer"
                        onClick={() => selectVideo(video)}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate line-through">{video.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          Assistido ✓
                        </p>
                        
                        {/* Resumo do vídeo */}
                        {video.summary && (
                          <div className="mt-2 p-2 bg-muted/30 rounded text-xs">
                            <p><strong>Canal:</strong> {video.summary.author}</p>
                            {video.summary.duration && (
                              <p><strong>Duração:</strong> {video.summary.duration}</p>
                            )}
                            {video.summary.description && video.summary.description !== 'Descrição não disponível' && (
                              <p className="mt-1 line-clamp-2"><strong>Descrição:</strong> {video.summary.description}</p>
                            )}
                          </div>
                        )}
                        
                        <div className="flex gap-2 mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectVideo(video)}
                            className="gap-1"
                          >
                            <StickyNote className="h-3 w-3" />
                            Ver Anotações
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWatched(video.id)}
                            className="gap-1"
                          >
                            <Circle className="h-3 w-3" />
                            Marcar como Não Assistido
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteVideo(video.id)}
                            className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
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
              {/* Player do YouTube */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">{selectedVideo.title}</h3>
                <div className="aspect-video">
                  <iframe
                    src={getEmbedUrl(selectedVideo.videoId)}
                    title={selectedVideo.title}
                    className="w-full h-full rounded-lg"
                    allowFullScreen
                  />
                </div>
              </div>

              {/* Anotações */}
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <StickyNote className="h-5 w-5" />
                  Anotações
                </h3>
                
                <textarea
                  value={videoNotes}
                  onChange={(e) => setVideoNotes(e.target.value)}
                  placeholder="Faça suas anotações sobre este vídeo..."
                  className="w-full h-40 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
                
                <div className="flex justify-end mt-3">
                  <Button onClick={saveNotes}>
                    Salvar Anotações
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-card border rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🎬</div>
              <h3 className="text-lg font-semibold mb-2">Selecione um vídeo</h3>
              <p className="text-muted-foreground">
                Clique em um vídeo da lista para assistir e fazer anotações
              </p>
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
            <div className="text-2xl font-bold text-blue-500">
              {videos.filter(video => video.notes && video.notes.trim()).length}
            </div>
            <div className="text-sm text-muted-foreground">Com Anotações</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VideoStudy

