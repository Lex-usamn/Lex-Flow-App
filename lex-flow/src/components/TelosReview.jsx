import { useState, useEffect } from 'react'
import { Save, Calendar, Download, Eye, Target, Heart, Brain, Shield, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'

const telosQuestions = [
  {
    id: 'vision',
    title: 'Visão',
    icon: Target,
    color: 'text-blue-500',
    question: 'O que fiz hoje que me aproximou da minha visão de futuro?',
    placeholder: 'Reflita sobre as ações que te levaram em direção aos seus objetivos de longo prazo...'
  },
  {
    id: 'purpose',
    title: 'Propósito',
    icon: Heart,
    color: 'text-red-500',
    question: 'Como minhas ações de hoje refletiram meu propósito de vida?',
    placeholder: 'Pense sobre como suas ações estiveram alinhadas com seu "porquê" mais profundo...'
  },
  {
    id: 'learning',
    title: 'Aprendizado',
    icon: Brain,
    color: 'text-green-500',
    question: 'O que aprendi hoje? Qual foi meu principal insight?',
    placeholder: 'Descreva os novos conhecimentos, habilidades ou perspectivas que adquiriu...'
  },
  {
    id: 'obstacles',
    title: 'Obstáculos',
    icon: Shield,
    color: 'text-orange-500',
    question: 'Qual foi o maior obstáculo que enfrentei hoje e como lidei com ele?',
    placeholder: 'Identifique os desafios e como você os superou ou planeja superá-los...'
  },
  {
    id: 'values',
    title: 'Valores',
    icon: Lightbulb,
    color: 'text-purple-500',
    question: 'Agi de acordo com meus valores fundamentais hoje?',
    placeholder: 'Avalie se suas decisões e comportamentos estiveram alinhados com seus princípios...'
  }
]

function TelosReview() {
  const [currentReview, setCurrentReview] = useState({})
  const [savedReviews, setSavedReviews] = useState([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [viewMode, setViewMode] = useState('current') // 'current' ou 'history'

  useEffect(() => {
    const reviews = JSON.parse(localStorage.getItem('lex-flow-telos-reviews') || '[]')
    setSavedReviews(reviews)
    
    // Carregar revisão do dia atual se existir
    const today = new Date().toISOString().split('T')[0]
    const todayReview = reviews.find(review => review.date === today)
    if (todayReview) {
      setCurrentReview(todayReview.answers)
    }
  }, [])

  const handleAnswerChange = (questionId, value) => {
    setCurrentReview(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const saveReview = () => {
    const today = new Date().toISOString().split('T')[0]
    const review = {
      date: today,
      answers: currentReview,
      createdAt: new Date().toISOString()
    }

    const existingReviews = savedReviews.filter(r => r.date !== today)
    const updatedReviews = [review, ...existingReviews]
    
    setSavedReviews(updatedReviews)
    localStorage.setItem('lex-flow-telos-reviews', JSON.stringify(updatedReviews))
    
    alert('Revisão TELOS salva com sucesso!')
  }

  const exportReviews = () => {
    const exportData = savedReviews.map(review => {
      const formattedDate = new Date(review.date).toLocaleDateString('pt-BR')
      let content = `# Revisão TELOS - ${formattedDate}\n\n`
      
      telosQuestions.forEach(question => {
        const answer = review.answers[question.id] || 'Não respondido'
        content += `## ${question.title}\n**${question.question}**\n\n${answer}\n\n`
      })
      
      return content
    }).join('\n---\n\n')

    const blob = new Blob([exportData], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lex-flow-telos-reviews-${new Date().toISOString().split('T')[0]}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getReviewByDate = (date) => {
    return savedReviews.find(review => review.date === date)
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getCompletionPercentage = (answers) => {
    const totalQuestions = telosQuestions.length
    const answeredQuestions = Object.values(answers).filter(answer => answer && answer.trim()).length
    return Math.round((answeredQuestions / totalQuestions) * 100)
  }

  const selectedReview = viewMode === 'history' ? getReviewByDate(selectedDate) : null

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🎯 Revisão TELOS</h2>
        <p className="text-muted-foreground">Reflexão diária baseada em valores, visão e propósito</p>
      </div>

      {/* Controles de Visualização */}
      <div className="bg-card border rounded-lg p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'current' ? "default" : "outline"}
              onClick={() => setViewMode('current')}
              className="gap-2"
            >
              <Target className="h-4 w-4" />
              Revisão de Hoje
            </Button>
            <Button
              variant={viewMode === 'history' ? "default" : "outline"}
              onClick={() => setViewMode('history')}
              className="gap-2"
            >
              <Eye className="h-4 w-4" />
              Histórico
            </Button>
          </div>

          <div className="flex gap-2">
            {savedReviews.length > 0 && (
              <Button
                variant="outline"
                onClick={exportReviews}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            )}
            
            {viewMode === 'current' && (
              <Button
                onClick={saveReview}
                disabled={Object.keys(currentReview).length === 0}
                className="gap-2"
              >
                <Save className="h-4 w-4" />
                Salvar Revisão
              </Button>
            )}
          </div>
        </div>

        {viewMode === 'history' && (
          <div className="mt-4">
            <label className="block text-sm font-medium mb-2">Selecionar Data</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        )}
      </div>

      {/* Formulário de Revisão */}
      {viewMode === 'current' && (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">
              Revisão de {formatDate(new Date().toISOString().split('T')[0])}
            </h3>
            <div className="text-sm text-muted-foreground">
              Progresso: {getCompletionPercentage(currentReview)}% completo
            </div>
          </div>

          {telosQuestions.map(question => {
            const IconComponent = question.icon
            return (
              <div key={question.id} className="bg-card border rounded-lg p-6">
                <div className="flex items-center gap-3 mb-4">
                  <IconComponent className={`h-6 w-6 ${question.color}`} />
                  <h3 className="text-lg font-semibold">{question.title}</h3>
                </div>
                
                <p className="text-foreground mb-4 font-medium">{question.question}</p>
                
                <textarea
                  value={currentReview[question.id] || ''}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  placeholder={question.placeholder}
                  className="w-full h-32 px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                />
              </div>
            )
          })}
        </div>
      )}

      {/* Visualização do Histórico */}
      {viewMode === 'history' && (
        <div className="space-y-6">
          {selectedReview ? (
            <>
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">
                  Revisão de {formatDate(selectedDate)}
                </h3>
                <div className="text-sm text-muted-foreground">
                  Completude: {getCompletionPercentage(selectedReview.answers)}%
                </div>
              </div>

              {telosQuestions.map(question => {
                const IconComponent = question.icon
                const answer = selectedReview.answers[question.id]
                
                return (
                  <div key={question.id} className="bg-card border rounded-lg p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <IconComponent className={`h-6 w-6 ${question.color}`} />
                      <h3 className="text-lg font-semibold">{question.title}</h3>
                    </div>
                    
                    <p className="text-foreground mb-4 font-medium">{question.question}</p>
                    
                    <div className="bg-muted/50 rounded-lg p-4">
                      {answer && answer.trim() ? (
                        <p className="text-foreground whitespace-pre-wrap">{answer}</p>
                      ) : (
                        <p className="text-muted-foreground italic">Não respondido</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </>
          ) : (
            <div className="bg-card border rounded-lg p-8 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma revisão encontrada</h3>
              <p className="text-muted-foreground">
                Não há revisão TELOS salva para {formatDate(selectedDate)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Estatísticas */}
      <div className="bg-card border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Estatísticas de Reflexão</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{savedReviews.length}</div>
            <div className="text-sm text-muted-foreground">Dias Refletidos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-500">
              {savedReviews.filter(review => 
                getCompletionPercentage(review.answers) === 100
              ).length}
            </div>
            <div className="text-sm text-muted-foreground">Revisões Completas</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-500">
              {savedReviews.length > 0 ? 
                Math.round(savedReviews.reduce((acc, review) => 
                  acc + getCompletionPercentage(review.answers), 0
                ) / savedReviews.length) : 0}%
            </div>
            <div className="text-sm text-muted-foreground">Completude Média</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-500">
              {savedReviews.length > 0 ? 
                Math.max(...savedReviews.map(review => 
                  new Date(review.date).getTime()
                )) > Date.now() - 7 * 24 * 60 * 60 * 1000 ? '🔥' : '💤' : '⭐'}
            </div>
            <div className="text-sm text-muted-foreground">Sequência</div>
          </div>
        </div>
      </div>

      {/* Dicas TELOS */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-3 text-primary">💡 Sobre a Metodologia TELOS</h3>
        <div className="space-y-2 text-sm">
          <p><strong>T</strong>elos (do grego): fim, propósito, objetivo final</p>
          <p>Esta reflexão diária ajuda você a:</p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Manter-se alinhado com seus valores e propósito</li>
            <li>Identificar padrões de crescimento e obstáculos</li>
            <li>Desenvolver autoconhecimento através da reflexão</li>
            <li>Criar um registro de sua jornada pessoal e profissional</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default TelosReview

