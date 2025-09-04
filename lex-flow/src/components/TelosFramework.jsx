// /opt/lex-flow/src/components/TelosFramework.jsx

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button.jsx';
import { Save, Upload, Loader2 } from 'lucide-react';
// CORREÇÃO: Importa as funções específicas da API
import { getTelosFramework, saveTelosFramework } from '../utils/api';
import { toast } from 'sonner';

// ESTRUTURA ATUALIZADA: Adicionada a nova seção.
const frameworkSections = [
    { id: 'problemas', title: '💢 Problemas', placeholder: 'Quais são os grandes problemas que você quer resolver no mundo ou na sua vida?' },
    { id: 'missoes', title: '🎯 Missões', placeholder: 'Qual é a sua missão para resolver esses problemas?' },
    { id: 'narrativas', title: '🗣 Narrativas', placeholder: 'Como você se descreve? Qual é a sua história, incluindo a versão curta, conversacional e o pitch de 30s?' },
    { id: 'metas', title: '🎯 Metas + Métricas', placeholder: 'Quais são seus objetivos específicos, mensuráveis e com prazo (SMART)?' },
    { id: 'desafios', title: '🧱 Desafios', placeholder: 'Quais são os desafios e obstáculos que te impedem?' },
    { id: 'estrategias', title: '🛠 Estratégias', placeholder: 'Quais estratégias e táticas você usará para superar os desafios e alcançar as metas?' },
    { id: 'projetos', title: '🚧 Projetos Atuais', placeholder: 'Liste os projetos em andamento que estão alinhados com suas missões e metas.' },
    { id: 'historia', title: '🕰 História', placeholder: 'Descreva sua jornada, marcos importantes e eventos que te moldaram.' },
    // NOVO: Seção adicionada conforme solicitado.
    { id: 'eventos_marcantes', title: '🏅 Outros Eventos Marcantes', placeholder: 'Liste outros eventos, realizações ou momentos notáveis que foram importantes na sua jornada.' },
];

function TelosFramework() {
    const [framework, setFramework] = useState({});
    const [isLoading, setIsLoading] = useState(true); // Inicia como true para o carregamento inicial
    const fileInputRef = useRef(null);

    // Efeito para carregar o framework do backend quando o componente é montado
    useEffect(() => {
        const loadFramework = async () => {
            setIsLoading(true);
            try {
                const response = await getTelosFramework();
                // O backend pode retornar null se o framework ainda não existir
                if (response.framework && response.framework.content) {
                    setFramework(response.framework.content);
                }
            } catch (error) {
                console.error("Não foi possível carregar o framework:", error);
                toast.error("Erro ao carregar seu Framework TELOS.");
            } finally {
                setIsLoading(false);
            }
        };
        loadFramework();
    }, []); // A dependência vazia [] garante que isso rode apenas uma vez

    // Função para salvar o framework no backend
    const handleSave = async () => {
        setIsLoading(true);
        try {
            // O backend espera um objeto com a chave 'content'
            await saveTelosFramework({ content: framework });
            toast.success('Framework TELOS salvo com sucesso!');
        } catch (error) {
            console.error("Erro ao salvar o framework:", error);
            toast.error("Não foi possível salvar o framework.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (id, value) => {
        setFramework(prev => ({ ...prev, [id]: value }));
    };
    
    const escapeRegex = (string) => {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    };

// VERSÃO NOVA E MAIS ROBUSTA
const parseTelosMarkdown = (content) => {
    const parsedData = {};
    // Normaliza as quebras de linha para LF (\n) para consistência
    const normalizedContent = content.replace(/\r\n/g, '\n');

    frameworkSections.forEach((section, index) => {
        const escapedTitle = escapeRegex(section.title);
        
        // Constrói a regex para encontrar a seção atual
        const startRegex = new RegExp(`^##\\s+${escapedTitle}\\s*$`, 'im');
        const matchStart = normalizedContent.match(startRegex);

        if (matchStart) {
            // Encontra o início do conteúdo da seção (após o título)
            let startIndex = matchStart.index + matchStart[0].length;
            let endIndex = normalizedContent.length;

            // Procura pela próxima seção para determinar o final do conteúdo da seção atual
            for (let i = index + 1; i < frameworkSections.length; i++) {
                const nextSection = frameworkSections[i];
                const escapedNextTitle = escapeRegex(nextSection.title);
                const nextRegex = new RegExp(`^##\\s+${escapedNextTitle}`, 'im');
                const matchNext = normalizedContent.substring(startIndex).match(nextRegex);
                
                if (matchNext) {
                    endIndex = startIndex + matchNext.index;
                    break; // Para no primeiro próximo título que encontrar
                }
            }
            
            // Extrai e limpa o conteúdo
            const sectionContent = normalizedContent.substring(startIndex, endIndex).trim();
            if (sectionContent) {
                parsedData[section.id] = sectionContent;
            }
        }
    });

    // Adiciona logs para depuração. Você pode remover isso depois.
    console.log("Conteúdo do arquivo:", content);
    console.log("Dados Parseados:", parsedData);

    return parsedData;
};

    // Função para lidar com o upload de arquivo e salvar diretamente no backend
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const parsedFramework = parseTelosMarkdown(content);
            
            if (Object.keys(parsedFramework).length === 0) {
                toast.error("Não foi possível encontrar seções válidas no arquivo .md. Verifique se os títulos (## Título) correspondem ao framework.");
                return;
            }

            setFramework(parsedFramework);
            
            // Após parsear, tenta salvar imediatamente no backend
            setIsLoading(true);
            try {
                await saveTelosFramework({ content: parsedFramework });
                toast.success('Arquivo .md importado e framework salvo com sucesso!');
            } catch (error) {
                console.error("Erro ao salvar o framework importado:", error);
                toast.error("O arquivo foi lido, mas houve um erro ao salvá-lo.");
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsText(file);
        event.target.value = null; 
    };
    
    const handleImportClick = () => {
        fileInputRef.current.click();
    };

    return (
        <div className="space-y-6 bg-card border rounded-lg p-6">
            <div className="flex justify-between items-center flex-wrap gap-2">
                <h2 className="text-2xl font-bold">🏛️ Seu Framework TELOS (Sua Constituição)</h2>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={handleImportClick} disabled={isLoading}>
                        <Upload className="mr-2 h-4 w-4"/> Importar de .md
                    </Button>
                    <Button onClick={handleSave} disabled={isLoading}>
                        {isLoading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                        ) : (
                            <Save className="mr-2 h-4 w-4"/>
                        )}
                        Salvar Framework
                    </Button>
                </div>
            </div>
            <p className="text-muted-foreground">Este é o seu documento mestre. Defina seus princípios aqui ou importe de um arquivo .md existente.</p>
            
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".md,text/markdown"
                className="hidden"
            />
            
            {isLoading && Object.keys(framework).length === 0 ? (
                <div className="text-center p-10">Carregando seu framework...</div>
            ) : (
                frameworkSections.map(section => (
                    <div key={section.id}>
                        <h3 className="text-lg font-semibold mb-2">## {section.title}</h3>
                        <textarea
                            value={framework[section.id] || ''}
                            onChange={(e) => handleChange(section.id, e.target.value)}
                            placeholder={section.placeholder}
                            className="w-full h-32 p-3 border rounded bg-background font-mono text-sm"
                            disabled={isLoading}
                        />
                    </div>
                ))
            )}
        </div>
    );
}

export default TelosFramework;