import React, { useState, useEffect } from 'react'
import { Trophy, Star, Zap, Target, Award, TrendingUp, Calendar, Download } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { gamificationManager, getProgress, getAchievements, getLeaderboard } from '../utils/gamification.js'

function Gamification() {
  const [progress, setProgress] = useState(getProgress())
  const [achievements, setAchievements] = useState(getAchievements())
  const [leaderboard, setLeaderboard] = useState(getLeaderboard())
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showLeaderboard, setShowLeaderboard] = useState(false)

  useEffect(() => {
    // Atualizar dados a cada minuto
    const interval = setInterval(() => {
      setProgress(getProgress())
      setAchievements(getAchievements())
      setLeaderboard(getLeaderboard())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const categories = [
    { id: 'all', name: 'Todas', icon: '🏆' },
    { id: 'tasks', name: 'Tarefas', icon: '✅' },
    { id: 'pomodoro', name: 'Pomodoro', icon: '🍅' },
    { id: 'study', name: 'Estudos', icon: '📚' },
    { id: 'telos', name: 'TELOS', icon: '🎯' },
    { id: 'streaks', name: 'Sequências', icon: '🔥' },
    { id: 'special', name: 'Especiais', icon: '💎' },
    { id: 'levels', name: 'Níveis', icon: '⭐' }
  ]

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(achievement => achievement.category === selectedCategory)

  const getLevelColor = (level) => {
    const colors = {
      1: '#94a3b8', 2: '#22c55e', 3: '#3b82f6', 4: '#8b5cf6', 5: '#f59e0b',
      6: '#ef4444', 7: '#ec4899', 8: '#06b6d4', 9: '#84cc16', 10: '#fbbf24'
    }
    return colors[level] || '#94a3b8'
  }

  const getStreakEmoji = (count) => {
    if (count >= 365) return '👑'
    if (count >= 100) return '🌟'
    if (count >= 30) return '🔥'
    if (count >= 7) return '⚡'
    return '💫'
  }

  const exportData = () => {
    gamificationManager.exportGamificationData()
  }

  const resetProgress = () => {
    if (gamificationManager.resetProgress()) {
      setProgress(getProgress())
      setAchievements(getAchievements())
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">🏆 Gamificação</h2>
          <p className="text-muted-foreground">Acompanhe seu progresso e conquistas</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            variant="outline"
            className="gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            {showLeaderboard ? 'Conquistas' : 'Ranking'}
          </Button>
          
          <Button onClick={exportData} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {!showLeaderboard ? (
        <>
          {/* Progresso Principal */}
          <div className="bg-card border rounded-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div 
                  className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: getLevelColor(progress.level) }}
                >
                  {progress.level}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{progress.levelName}</h3>
                  <p className="text-muted-foreground">Nível {progress.level}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-bold text-yellow-500">{progress.totalPoints}</div>
                <div className="text-sm text-muted-foreground">pontos totais</div>
              </div>
            </div>
            
            {/* Barra de Progresso */}
            <div className="mb-4">
              <div className="flex justify-between text-sm mb-2">
                <span>Progresso no nível</span>
                <span>{progress.progressInLevel}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-500"
                  style={{ 
                    width: `${progress.progressInLevel}%`,
                    backgroundColor: getLevelColor(progress.level)
                  }}
                />
              </div>
              {progress.nextLevelXP && (
                <div className="text-xs text-muted-foreground mt-1">
                  {progress.experience} / {progress.nextLevelXP} XP
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🏆</div>
              <div className="text-2xl font-bold">{progress.achievements}</div>
              <div className="text-sm text-muted-foreground">Conquistas</div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">{getStreakEmoji(progress.currentStreak)}</div>
              <div className="text-2xl font-bold">{progress.currentStreak}</div>
              <div className="text-sm text-muted-foreground">Sequência Atual</div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">🔥</div>
              <div className="text-2xl font-bold">{progress.longestStreak}</div>
              <div className="text-sm text-muted-foreground">Maior Sequência</div>
            </div>
            
            <div className="bg-card border rounded-lg p-4 text-center">
              <div className="text-2xl mb-2">⚡</div>
              <div className="text-2xl font-bold">{progress.experience}</div>
              <div className="text-sm text-muted-foreground">Experiência</div>
            </div>
          </div>

          {/* Filtros de Categoria */}
          <div className="bg-card border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">🏅 Conquistas</h3>
            
            <div className="flex flex-wrap gap-2 mb-6">
              {categories.map(category => (
                <Button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  size="sm"
                  className="gap-2"
                >
                  <span>{category.icon}</span>
                  {category.name}
                </Button>
              ))}
            </div>

            {/* Lista de Conquistas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAchievements.length > 0 ? (
                filteredAchievements.map(achievement => (
                  <div 
                    key={achievement.id}
                    className="p-4 border rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border-yellow-200 dark:border-yellow-800"
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
                          {achievement.name}
                        </h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-2">
                          {achievement.description}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
                            +{achievement.points} pts
                          </span>
                          <span className="text-xs text-yellow-600 dark:text-yellow-400">
                            {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  {selectedCategory === 'all' 
                    ? 'Nenhuma conquista desbloqueada ainda. Continue usando o app!'
                    : `Nenhuma conquista na categoria "${categories.find(c => c.id === selectedCategory)?.name}".`
                  }
                </div>
              )}
            </div>
          </div>

          {/* Próximas Conquistas */}
          <div className="bg-card border rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">🎯 Próximas Conquistas</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🏆</span>
                  <div>
                    <h4 className="font-medium">Mestre das Tarefas</h4>
                    <p className="text-sm text-muted-foreground">Complete 100 tarefas</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${Math.min((gamificationManager.userStats.tasksCompleted / 100) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {gamificationManager.userStats.tasksCompleted} / 100 tarefas
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">⚔️</span>
                  <div>
                    <h4 className="font-medium">Guerreiro Pomodoro</h4>
                    <p className="text-sm text-muted-foreground">Complete 50 Pomodoros</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full"
                    style={{ width: `${Math.min((gamificationManager.userStats.pomodorosCompleted / 50) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {gamificationManager.userStats.pomodorosCompleted} / 50 Pomodoros
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🎓</span>
                  <div>
                    <h4 className="font-medium">Erudito</h4>
                    <p className="text-sm text-muted-foreground">Acumule 50 horas de estudo</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${Math.min((gamificationManager.userStats.studyHours / 50) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(gamificationManager.userStats.studyHours)} / 50 horas
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">🔥</span>
                  <div>
                    <h4 className="font-medium">Guerreiro da Semana</h4>
                    <p className="text-sm text-muted-foreground">7 dias consecutivos</p>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div 
                    className="bg-orange-500 h-2 rounded-full"
                    style={{ width: `${Math.min((progress.currentStreak / 7) * 100, 100)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {progress.currentStreak} / 7 dias
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        /* Leaderboard */
        <div className="bg-card border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-6">🏆 Ranking de Produtividade</h3>
          
          <div className="space-y-4">
            {leaderboard.map((user, index) => (
              <div 
                key={user.name}
                className={`flex items-center gap-4 p-4 rounded-lg border ${
                  user.name === 'Você' 
                    ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' 
                    : 'bg-muted/50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                  index === 0 ? 'bg-yellow-500' :
                  index === 1 ? 'bg-gray-400' :
                  index === 2 ? 'bg-orange-600' : 'bg-gray-500'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{user.name}</span>
                    {user.name === 'Você' && (
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded dark:bg-blue-900 dark:text-blue-200">
                        Você
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Nível {user.level}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-yellow-600">{user.points}</div>
                  <div className="text-xs text-muted-foreground">pontos</div>
                </div>
                
                {index < 3 && (
                  <div className="text-2xl">
                    {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              💡 <strong>Dica:</strong> Complete mais tarefas, sessões Pomodoro e estudos para subir no ranking!
            </p>
          </div>
        </div>
      )}

      {/* Ações */}
      <div className="flex justify-center">
        <Button 
          onClick={resetProgress} 
          variant="outline" 
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          Resetar Progresso
        </Button>
      </div>
    </div>
  )
}

export default Gamification

