import React, { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Area, AreaChart } from 'recharts'
import { Calendar, TrendingUp, Clock, Target, BookOpen, StickyNote, Award, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { getAnalyticsData, exportAnalyticsReport } from '../utils/api'
import { toast } from 'sonner'

function Analytics() {
    const [timeRange, setTimeRange] = useState('week') // 'week', 'month', 'year'
    const [isLoading, setIsLoading] = useState(true)
    const [analyticsData, setAnalyticsData] = useState({
        pomodoroStats: [],
        taskStats: [],
        studyStats: [],
        productivityTrends: [],
        categoryDistribution: [],
        weeklyProgress: []
    })

    useEffect(() => {
        const fetchAnalytics = async () => {
            setIsLoading(true);
            try {
                const response = await getAnalyticsData(timeRange);
                // Define o estado com os dados reais vindos do backend
                setAnalyticsData(response.data || {
                    pomodoroStats: [], taskStats: [], studyStats: [],
                    productivityTrends: [], categoryDistribution: [], weeklyProgress: []
                });
            } catch (error) {
                console.error("Erro ao carregar análises:", error);
                toast.error("Não foi possível carregar os dados de análise.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalytics();
    }, [timeRange]) // Este efeito é re-executado sempre que o timeRange muda

    const exportReport = async () => {
        try {
            const response = await exportAnalyticsReport(timeRange);
            
            const blob = new Blob([JSON.stringify(response.report, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `lex-flow-analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            toast.success("Relatório exportado com sucesso!");

        } catch (error) {
            console.error("Erro ao exportar relatório:", error);
            toast.error("Não foi possível exportar o relatório.");
        }
    }

    const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Carregando suas análises...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold mb-2">📊 Análises e Relatórios</h2>
                    <p className="text-muted-foreground">Insights sobre sua produtividade e progresso</p>
                </div>
                
                <div className="flex gap-2">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="px-3 py-2 border border-input rounded-md bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                        <option value="week">Última Semana</option>
                        <option value="month">Último Mês</option>
                        <option value="year">Último Ano</option>
                    </select>
                    
                    <Button onClick={exportReport} variant="outline" className="gap-2">
                        <TrendingUp className="h-4 w-4" />
                        Exportar Relatório
                    </Button>
                </div>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-5 w-5 text-red-500" />
                        <span className="font-medium">Pomodoros</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {analyticsData.pomodoroStats.reduce((sum, day) => sum + day.sessions, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {Math.round(analyticsData.pomodoroStats.reduce((sum, day) => sum + day.focusTime, 0) / 60)}h focadas
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Target className="h-5 w-5 text-green-500" />
                        <span className="font-medium">Tarefas Concluídas</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {analyticsData.taskStats.reduce((sum, cat) => sum + cat.count, 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        {analyticsData.taskStats.length} categorias
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="h-5 w-5 text-blue-500" />
                        <span className="font-medium">Estudos</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {analyticsData.studyStats.filter(s => s.watched).length}
                    </div>
                    <div className="text-sm text-muted-foreground">
                        vídeos assistidos
                    </div>
                </div>

                <div className="bg-card border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Award className="h-5 w-5 text-purple-500" />
                        <span className="font-medium">Produtividade</span>
                    </div>
                    <div className="text-2xl font-bold">
                        {Math.round(analyticsData.productivityTrends.reduce((sum, day) => sum + day.productivity, 0) / (analyticsData.productivityTrends.length || 1)) || 0}%
                    </div>
                    <div className="text-sm text-muted-foreground">
                        média do período
                    </div>
                </div>
            </div>

            {/* Gráfico de Pomodoros por Dia */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">🍅 Sessões Pomodoro por Dia</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analyticsData.pomodoroStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip 
                            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                            formatter={(value, name) => [value, name === 'sessions' ? 'Sessões' : 'Tempo (min)']}
                        />
                        <Bar dataKey="sessions" fill="#ef4444" name="Sessões" />
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Gráfico de Tendência de Produtividade */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">📈 Tendência de Produtividade</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analyticsData.productivityTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis domain={[0, 100]} unit="%" />
                        <Tooltip 
                            labelFormatter={(label) => new Date(label).toLocaleDateString('pt-BR')}
                            formatter={(value) => [`${value}%`, 'Produtividade']}
                        />
                        <Area type="monotone" dataKey="productivity" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribuição de Tarefas por Categoria */}
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">🎯 Distribuição de Tarefas</h3>
                    {analyticsData.categoryDistribution.length > 0 ? (
                        <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                                <Pie
                                    data={analyticsData.categoryDistribution}
                                    cx="50%" cy="50%" labelLine={false}
                                    label={({ category, percentage }) => `${category}: ${percentage}%`}
                                    outerRadius={80} fill="#8884d8" dataKey="count"
                                >
                                    {analyticsData.categoryDistribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name]} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">Nenhuma tarefa encontrada para análise</div>
                    )}
                </div>

                {/* Progresso Semanal */}
                <div className="bg-card border rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4">📅 Progresso Semanal</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analyticsData.weeklyProgress}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="day" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="pomodoros" stroke="#ef4444" strokeWidth={2} name="Pomodoros" />
                            <Line type="monotone" dataKey="tasks" stroke="#22c55e" strokeWidth={2} name="Tarefas" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Insights e Recomendações (Mantidos, mas agora com dados reais) */}
            <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">💡 Insights e Recomendações</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* ... (a lógica de insights pode ser mantida, pois ela opera sobre o estado 'analyticsData' que agora é real) ... */}
                </div>
            </div>
        </div>
    )
}

export default Analytics;