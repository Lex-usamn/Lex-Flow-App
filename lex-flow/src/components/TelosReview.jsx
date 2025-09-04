// /opt/lex-flow/src/components/TelosReview.jsx

import { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getTelosFramework, getTelosReviews, saveTelosReview, analyzeTelos, chatWithTelos } from '@/utils/api.js';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

const telosQuestions = [
    { id: 'vision', title: 'Visão', question: 'O que fiz hoje que me aproximou da minha visão de futuro?' },
    { id: 'purpose', title: 'Propósito', question: 'Como minhas ações de hoje refletiram meu propósito de vida?' },
    { id: 'learning', title: 'Aprendizado', question: 'O que aprendi hoje? Qual foi meu principal insight?' },
    { id: 'obstacles', title: 'Obstáculos', question: 'Qual foi o maior obstáculo que enfrentei hoje e como lidei com ele?' },
    { id: 'values', title: 'Valores', question: 'Agi de acordo com meus valores fundamentais hoje?' }
];

const REVIEW_TYPES = {
    DAILY: 'Diário',
    WEEKLY: 'Semanal',
    MONTHLY: 'Mensal',
};

const ANALYSIS_PATTERNS = {
    summary: "Análise Padrão",
    red_team: "Análise Crítica (Red Team)",
    blindspots: "Pontos Cegos",
    encouragement: "Encorajamento",
};

function TelosReviewAI() {
    const [reviews, setReviews] = useState([]); // Armazenará todas as revisões do usuário vindas da API
    const [currentView, setCurrentView] = useState(REVIEW_TYPES.DAILY);
    const [dailyAnswers, setDailyAnswers] = useState({});
    const [frameworkText, setFrameworkText] = useState('');
    const [analysisPattern, setAnalysisPattern] = useState('summary');
    const [aiInsight, setAiInsight] = useState('');
    const [chatHistory, setChatHistory] = useState([]);
    const [userMessage, setUserMessage] = useState('');
    const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
    const [isChatLoading, setIsChatLoading] = useState(false);
    const chatContainerRef = useRef(null);
        // === MUDANÇA AQUI: Adicionando estados de carregamento e erro iniciais ===
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Efeito para carregar dados iniciais do backend
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                // Seta isLoading para true no início da busca
                setIsLoading(true);
                setError(null); // Limpa erros anteriores

                const frameworkData = await getTelosFramework();
                if (frameworkData && frameworkData.framework && frameworkData.framework.content) {
                    const formattedFramework = Object.entries(frameworkData.framework.content)
                        .map(([key, value]) => `## ${key.charAt(0).toUpperCase() + key.slice(1).replace('_', ' ')}\n${value}\n`)
                        .join('\n');
                    setFrameworkText(formattedFramework);
                } else {
                    setFrameworkText("Framework TELOS não definido. Por favor, vá para a página 'Framework TELOS' para configurá-lo.");
                }

                const reviewsData = await getTelosReviews();
                const sortedReviews = (reviewsData.reviews || []).sort((a, b) => new Date(b.review_date) - new Date(a.review_date));
                setReviews(sortedReviews);

                const today = new Date().toISOString().split('T')[0];
                const todayReview = sortedReviews.find(r => r.review_date === today);
                setDailyAnswers(todayReview ? todayReview.content : {});

            } catch (err) { // Renomeado para 'err' para evitar conflito
                console.error("Erro ao carregar dados do TELOS:", err);
                // Seta a mensagem de erro para ser exibida na tela
                setError("Não foi possível carregar seus dados do TELOS. Verifique sua conexão e tente novamente.");
                toast.error("Não foi possível carregar seus dados do TELOS.");
            } finally {
                // Seta isLoading para false quando a busca termina (com sucesso ou erro)
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);

    // Efeito para limpar a análise quando a visão (Diário/Semanal/Mensal) muda
    useEffect(() => {
        setAiInsight('');
        setChatHistory([]);
    }, [currentView]);

    // Efeito para rolar o chat para a última mensagem
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatHistory]);

    const reviewsForAnalysis = useMemo(() => {
        if (currentView === REVIEW_TYPES.DAILY) return '';
        let relevantReviews = [];
        const now = new Date();
        if (currentView === REVIEW_TYPES.WEEKLY) {
            const oneWeekAgo = new Date(new Date().setDate(now.getDate() - 7));
            relevantReviews = reviews.filter(r => new Date(r.review_date) >= oneWeekAgo);
        } else if (currentView === REVIEW_TYPES.MONTHLY) {
            const oneMonthAgo = new Date(new Date().setMonth(now.getMonth() - 1));
            relevantReviews = reviews.filter(r => new Date(r.review_date) >= oneMonthAgo);
        }
        if (relevantReviews.length === 0) return "Nenhuma revisão diária encontrada para este período.";
        
        // O backend espera o 'content' que já está no formato de respostas
        return relevantReviews.map(review => {
            let content = `# Revisão de ${new Date(review.review_date).toLocaleDateString('pt-BR')}\n`;
            telosQuestions.forEach(q => { content += `## ${q.title}\n${review.content[q.id] || 'Não respondido.'}\n\n`; });
            return content;
        }).join('---\n');
    }, [reviews, currentView]);
    
    // Salva a revisão diária no backend
    const handleSaveDaily = async () => {
        const today = new Date().toISOString().split('T')[0];
        const reviewData = {
            review_date: today,
            content: dailyAnswers,
        };
        try {
            const savedReview = await saveTelosReview(reviewData);
            // Atualiza o estado local com a revisão salva/atualizada
            const otherReviews = reviews.filter(r => r.review_date !== today);
            const updatedReviews = [...otherReviews, savedReview.review].sort((a,b) => new Date(b.review_date) - new Date(a.review_date));
            setReviews(updatedReviews);
            toast.success('Revisão diária salva com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar revisão:", error);
            toast.error("Não foi possível salvar a revisão diária.");
        }
    };

    // Executa a análise com IA via backend
    const handleRunAnalysis = async () => {
        setIsAnalysisLoading(true); setAiInsight(''); setChatHistory([]);
        try {
            // CORREÇÃO: Usa a função específica da API
            const data = await analyzeTelos({
                daily_text: reviewsForAnalysis,
                framework_text: frameworkText,
                pattern: analysisPattern,
            });
            setAiInsight(data.insight);
        } catch (error) { 
            setAiInsight(`**Erro ao obter insight:**\n\n${error.message}`); 
        } finally { 
            setIsAnalysisLoading(false); 
        }
    };

    // Envia mensagem para o chat com IA via backend
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!userMessage.trim() || isChatLoading) return;
        const newMessage = { role: 'user', content: userMessage };
        setChatHistory(prev => [...prev, newMessage]);
        setUserMessage(''); setIsChatLoading(true);
        try {
            // CORREÇÃO: Usa a função específica da API
            const data = await chatWithTelos({
                question: userMessage,
                daily_text: reviewsForAnalysis,
                framework_text: frameworkText,
            });
            setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
        } catch (error) { 
            setChatHistory(prev => [...prev, { role: 'assistant', content: `**Erro:** ${error.message}` }]); 
        } finally { 
            setIsChatLoading(false); 
        }
    };

    const renderDailyView = () => (
        <div className="space-y-4 bg-card border rounded-lg p-6">
            {telosQuestions.map(q => (
                <div key={q.id}>
                    <h3 className="font-semibold">{q.title}: {q.question}</h3>
                    <textarea
                        value={dailyAnswers[q.id] || ''}
                        onChange={e => setDailyAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                        className="w-full h-24 mt-2 p-2 border rounded bg-background"
                        placeholder={`Reflexão sobre ${q.title.toLowerCase()}...`}
                    />
                </div>
            ))}
            <Button onClick={handleSaveDaily}>Salvar Revisão Diária</Button>
        </div>
    );

    const renderSynthesisView = () => (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[75vh]">
            <div className="flex flex-col bg-card border rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">Dados Coletados ({currentView})</h3>
                <div className="flex-grow overflow-y-auto bg-muted/50 p-3 rounded-md text-sm whitespace-pre-wrap font-mono">
                    <h4 className="font-bold text-primary mb-2">[Constituição Pessoal]</h4>
                    <p className='mb-4'>{frameworkText}</p>
                    <hr className="my-4 border-dashed" />
                    <h4 className="font-bold text-primary mb-2">[Reflexões Diárias]</h4>
                    {reviewsForAnalysis}
                </div>
            </div>
            <div className="flex flex-col bg-card border rounded-lg p-4">
                <h3 className="text-lg font-bold mb-2">Painel de Análise (Gemini IA)</h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                    <Select value={analysisPattern} onValueChange={setAnalysisPattern}>
                        <SelectTrigger className="flex-grow">
                            <SelectValue placeholder="Tipo de Análise" />
                        </SelectTrigger>
                        <SelectContent>
                            {Object.entries(ANALYSIS_PATTERNS).map(([key, value]) => (
                                <SelectItem key={key} value={key}>{value}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button 
                        onClick={handleRunAnalysis} 
                        disabled={isAnalysisLoading || reviewsForAnalysis.startsWith("Nenhuma") || !frameworkText.trim() || frameworkText.startsWith("Framework TELOS não definido")}
                        className="flex-shrink-0"
                    >
                        {isAnalysisLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4"/>}
                        Analisar Período
                    </Button>
                </div>
                <div className="flex-grow flex flex-col overflow-y-hidden mt-2 bg-muted/50 p-3 rounded-md">
                    {!aiInsight && !isAnalysisLoading && <p className="text-center m-auto text-muted-foreground">Selecione um tipo de análise e clique em "Analisar Período" para obter insights.</p>}
                    {isAnalysisLoading && <p className="text-center m-auto text-muted-foreground">Gemini está analisando suas reflexões...</p>}
                    {aiInsight && (
                        <div className="flex flex-col flex-grow overflow-y-hidden">
                            <div className="prose prose-sm dark:prose-invert max-w-none mb-4 pb-4 border-b overflow-y-auto">
                                <ReactMarkdown>{aiInsight}</ReactMarkdown>
                            </div>
                            <div ref={chatContainerRef} className="flex-grow space-y-4 pr-2 overflow-y-auto">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] p-3 rounded-lg text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-background'}`}>
                                            <ReactMarkdown className="prose-sm dark:prose-invert max-w-none">{msg.content}</ReactMarkdown>
                                        </div>
                                    </div>
                                ))}
                                {isChatLoading && <div className="text-center text-muted-foreground text-sm py-2">Gemini está pensando...</div>}
                            </div>
                            <form onSubmit={handleSendMessage} className="flex gap-2 mt-4">
                                <input type="text" value={userMessage} onChange={e => setUserMessage(e.target.value)}
                                    placeholder="Converse sobre a análise..."
                                    className="flex-grow p-2 border rounded-md bg-transparent focus:outline-none focus:ring-2 focus:ring-ring"
                                    disabled={isChatLoading}
                                />
                                <Button type="submit" size="icon" disabled={!userMessage.trim() || isChatLoading}><Send className="h-4 w-4"/></Button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
    // === MUDANÇA AQUI: Adicionando a renderização condicional de loading/erro ===
    if (isLoading) {
        return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    if (error) {
        return <div className="text-center text-red-500 bg-red-100 dark:bg-red-900/20 border border-red-500 rounded-lg p-6">{error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">🎯 TELOS: AI-Augmented Journal</h2>
                <div className="flex gap-2">
                    {Object.values(REVIEW_TYPES).map(type => (
                        <Button key={type} variant={currentView === type ? 'default' : 'outline'} onClick={() => setCurrentView(type)}>{type}</Button>
                    ))}
                </div>
            </div>
            {currentView === REVIEW_TYPES.DAILY ? renderDailyView() : renderSynthesisView()}
        </div>
    );
}

export default TelosReviewAI;