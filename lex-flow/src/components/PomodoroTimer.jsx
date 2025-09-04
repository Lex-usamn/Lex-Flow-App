import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Play, Pause, Square, Settings, Bell, BellOff } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { pomodoroNotifications, requestNotificationPermission } from '../utils/notifications.js'
// CORREÇÃO: Importa as funções específicas da API
import { getPomodoroData, savePomodoroSettings, savePomodoroSession } from '../utils/api'
import { toast } from 'sonner'

function PomodoroTimer() {
    const [timeLeft, setTimeLeft] = useState(25 * 60)
    const [isActive, setIsActive] = useState(false)
    const [currentTask, setCurrentTask] = useState('')
    const [sessionType, setSessionType] = useState('work') // 'work', 'shortBreak', 'longBreak'
    const [sessionsCompleted, setSessionsCompleted] = useState(0)
    const [showSettings, setShowSettings] = useState(false)
    const [notificationsEnabled, setNotificationsEnabled] = useState(true)
    const intervalRef = useRef(null)

    // Configurações do Pomodoro com valores padrão
    const [settings, setSettings] = useState({
        workDuration: 25,
        shortBreakDuration: 5,
        longBreakDuration: 15,
        sessionsUntilLongBreak: 4
    })

    // Carregar configurações e estatísticas do backend
    useEffect(() => {
        const loadData = async () => {
            try {
                const response = await getPomodoroData();
                if (response.settings) {
                    setSettings(response.settings);
                    // Inicia o timer com a duração correta do trabalho
                    if (!isActive) { // Só ajusta se não estiver ativo
                        setTimeLeft(response.settings.workDuration * 60);
                    }
                }
                if (response.stats) {
                    setSessionsCompleted(response.stats.sessionsCompletedToday || 0);
                }
                requestNotificationPermission();
            } catch (error) {
                console.error("Erro ao carregar dados do Pomodoro:", error);
                toast.error("Não foi possível carregar suas configurações do Pomodoro.");
            }
        };
        loadData();
    }, []); // A dependência vazia [] garante que isso rode apenas uma vez

    // Função para salvar configurações no backend
    const handleSaveSettings = useCallback(async (newSettings) => {
        try {
            await savePomodoroSettings(newSettings);
            toast.success("Configurações salvas!");
        } catch (error) {
            console.error("Erro ao salvar configurações:", error);
            toast.error("Não foi possível salvar as configurações.");
        }
    }, []);

    // Atualiza o tempo restante quando as configurações ou o tipo de sessão mudam, mas apenas se o timer não estiver ativo
    useEffect(() => {
        if (!isActive) {
            if (sessionType === 'work') {
                setTimeLeft(settings.workDuration * 60);
            } else if (sessionType === 'shortBreak') {
                setTimeLeft(settings.shortBreakDuration * 60);
            } else if (sessionType === 'longBreak') {
                setTimeLeft(settings.longBreakDuration * 60);
            }
        }
    }, [settings, sessionType, isActive]);

    const handleSessionComplete = useCallback(async () => {
        setIsActive(false);
        
        if (sessionType === 'work') {
            const newSessionsCompleted = sessionsCompleted + 1;
            setSessionsCompleted(newSessionsCompleted);
            
            try {
                // Informa o backend que uma sessão foi concluída
                await savePomodoroSession();
            } catch (error) {
                console.error("Erro ao registrar sessão:", error);
                // Não impede o fluxo da UI se a API falhar
            }
            
            if (notificationsEnabled) pomodoroNotifications.end('trabalho');
            
            if (newSessionsCompleted % settings.sessionsUntilLongBreak === 0) {
                setSessionType('longBreak');
                if (notificationsEnabled) pomodoroNotifications.breakStart('longo');
            } else {
                setSessionType('shortBreak');
                if (notificationsEnabled) pomodoroNotifications.breakStart('curto');
            }
        } else {
            if (notificationsEnabled) pomodoroNotifications.breakEnd();
            setSessionType('work');
        }
    }, [sessionType, sessionsCompleted, settings, notificationsEnabled]);

    // Timer principal
    useEffect(() => {
        if (isActive && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft(prevTime => prevTime - 1);
            }, 1000);
        } else if (timeLeft === 0 && isActive) { // A condição 'isActive' previne múltiplos disparos
            handleSessionComplete();
        }
        return () => clearInterval(intervalRef.current);
    }, [isActive, timeLeft, handleSessionComplete]);

    const startTimer = () => {
        setIsActive(true);
        if (notificationsEnabled) {
            if (sessionType === 'work') pomodoroNotifications.start('trabalho');
            else pomodoroNotifications.breakStart(sessionType === 'longBreak' ? 'longo' : 'curto');
        }
    };

    const pauseTimer = () => setIsActive(false);

    const resetTimer = () => {
        setIsActive(false);
        // O useEffect que observa [settings, sessionType, isActive] já vai recalcular o tempo
        // Chamamos aqui para garantir a resposta imediata
        if (sessionType === 'work') setTimeLeft(settings.workDuration * 60);
        else if (sessionType === 'shortBreak') setTimeLeft(settings.shortBreakDuration * 60);
        else setTimeLeft(settings.longBreakDuration * 60);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const getSessionTypeText = () => {
        switch (sessionType) {
            case 'work': return 'Trabalho';
            case 'shortBreak': return 'Intervalo Curto';
            case 'longBreak': return 'Intervalo Longo';
            default: return 'Trabalho';
        }
    };

    const getSessionColor = () => {
        switch (sessionType) {
            case 'work': return 'text-red-500';
            case 'shortBreak': return 'text-green-500';
            case 'longBreak': return 'text-blue-500';
            default: return 'text-red-500';
        }
    };
    
    const maxTime = sessionType === 'work' ? settings.workDuration * 60 :
                    sessionType === 'shortBreak' ? settings.shortBreakDuration * 60 :
                    settings.longBreakDuration * 60;
    const progress = maxTime > 0 ? ((maxTime - timeLeft) / maxTime) * 100 : 0;

    const toggleNotifications = () => {
        setNotificationsEnabled(!notificationsEnabled);
        if (!notificationsEnabled) requestNotificationPermission();
    };

    // Handler para salvar quando o input de configuração muda
    const handleSettingChange = (key, value) => {
        const intValue = parseInt(value, 10);
        // Validação para não aceitar valores inválidos
        if (isNaN(intValue) || intValue < 1) return;

        const newSettings = { ...settings, [key]: intValue };
        setSettings(newSettings);
        handleSaveSettings(newSettings); // Salva no backend
    };
    
    return (
        <div className="space-y-6">
            <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">🍅 Timer Pomodoro</h2>
                <p className="text-muted-foreground">Técnica de produtividade com foco e intervalos</p>
            </div>

            {/* Timer Principal */}
            <div className="bg-card border rounded-lg p-8 text-center">
                <div className="mb-4">
                    <h3 className={`text-lg font-semibold ${getSessionColor()}`}>{getSessionTypeText()}</h3>
                    <p className="text-sm text-muted-foreground">Sessões completadas: {sessionsCompleted}</p>
                </div>

                <div className="relative w-48 h-48 mx-auto mb-6">
                    <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none" className="text-muted-foreground/20" />
                        <circle
                            cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none"
                            strokeDasharray={`${2 * Math.PI * 45}`}
                            strokeDashoffset={`${2 * Math.PI * 45 * (1 - progress / 100)}`}
                            className={getSessionColor()} strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                            <div className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-center gap-3 mb-4">
                    <Button onClick={isActive ? pauseTimer : startTimer} size="lg" className="gap-2">
                        {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                        {isActive ? 'Pausar' : 'Iniciar'}
                    </Button>
                    <Button onClick={resetTimer} variant="outline" size="lg" className="gap-2">
                        <Square className="h-5 w-5" /> Reset
                    </Button>
                    <Button onClick={() => setShowSettings(!showSettings)} variant="outline" size="lg" className="gap-2">
                        <Settings className="h-5 w-5" />
                    </Button>
                    <Button onClick={toggleNotifications} variant="outline" size="lg" className="gap-2">
                        {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
                    </Button>
                </div>

                {sessionType === 'work' && (
                    <div className="mt-4">
                        <input
                            type="text" value={currentTask} onChange={(e) => setCurrentTask(e.target.value)}
                            placeholder="Em que você está trabalhando?"
                            className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                )}
            </div>

            {/* Configurações */}
            {showSettings && (
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">⚙️ Configurações</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Duração do Trabalho (minutos)</label>
                            <input type="number" min="1" max="60" value={settings.workDuration}
                                onChange={(e) => handleSettingChange('workDuration', e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Intervalo Curto (minutos)</label>
                            <input type="number" min="1" max="30" value={settings.shortBreakDuration}
                                onChange={(e) => handleSettingChange('shortBreakDuration', e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Intervalo Longo (minutos)</label>
                            <input type="number" min="1" max="60" value={settings.longBreakDuration}
                                onChange={(e) => handleSettingChange('longBreakDuration', e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-2">Sessões até Intervalo Longo</label>
                            <input type="number" min="2" max="10" value={settings.sessionsUntilLongBreak}
                                onChange={(e) => handleSettingChange('sessionsUntilLongBreak', e.target.value)}
                                className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                            />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <input type="checkbox" id="notifications" checked={notificationsEnabled} onChange={toggleNotifications} className="rounded" />
                        <label htmlFor="notifications" className="text-sm">Habilitar notificações do navegador</label>
                    </div>
                </div>
            )}

            {/* Estatísticas */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">📊 Estatísticas de Hoje</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{sessionsCompleted}</div>
                        <div className="text-sm text-muted-foreground">Pomodoros</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">
                            {Math.floor(sessionsCompleted * settings.workDuration / 60)}h {(sessionsCompleted * settings.workDuration) % 60}m
                        </div>
                        <div className="text-sm text-muted-foreground">Tempo Focado</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{Math.floor(sessionsCompleted / settings.sessionsUntilLongBreak)}</div>
                        <div className="text-sm text-muted-foreground">Ciclos Completos</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-500">
                            {sessionsCompleted > 0 ? settings.workDuration : 0}min
                        </div>
                        <div className="text-sm text-muted-foreground">Média por Sessão</div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PomodoroTimer