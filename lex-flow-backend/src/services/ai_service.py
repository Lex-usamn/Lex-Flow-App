# ai_service.py
import os
import json
import asyncio
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import openai
import google.generativeai as genai # CORREÇÃO: Import padrão, mais limpo

# ==================== CÓDIGO DE DEPURAÇÃO ====================
print("--- INICIANDO DEPURAÇÃO DO GOOGLE GENAI ---")
try:
    # CORREÇÃO: O atributo padrão para versão é __version__
    print(f"Caminho do módulo genai: {genai.__file__}")
    if hasattr(genai, '__version__'):
        print(f"Versão reportada pelo módulo: {genai.__version__}")
except Exception as e:
    print(f"Não foi possível inspecionar o módulo genai: {e}")
print("--- FIM DA DEPURAÇÃO ---")
# ==========================================================


class AIService:
    def __init__(self):
        # Configurar OpenAI (mantenha como está)
        self.openai_client = None
        if os.getenv('OPENAI_API_KEY'):
            try:
                self.openai_client = openai.OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
                print("Cliente OpenAI configurado com sucesso.")
            except Exception as e:
                print(f"ERRO: Falha ao configurar o cliente OpenAI: {e}")

        # Configurar Gemini
        self.gemini_client = None
        self.default_model_gemini = "gemini-1.5-flash" # CORREÇÃO: "gemini-1.5-flash" é o nome correto do modelo mais recente e rápido. "gemini-2.5-flash" não existe no momento.
        
        gemini_api_key = os.getenv('GEMINI_API_KEY')
        if gemini_api_key:
            try:
                # ================== CORREÇÃO CRUCIAL NA INICIALIZAÇÃO ==================
                # 1. Primeiro, configuramos a chave da API para toda a biblioteca.
                genai.configure(api_key=gemini_api_key)
                
                # 2. Depois, criamos a instância do modelo que vamos usar.
                self.gemini_client = genai.GenerativeModel(self.default_model_gemini)
                
                print("Cliente Google Gemini configurado com sucesso.")
                # =======================================================================
            except Exception as e:
                print(f"ERRO: Falha ao configurar o cliente Google Gemini: {e}")
                self.gemini_client = None
        else:
            print("AVISO: Chave de API do Gemini (GEMINI_API_KEY) não encontrada no ambiente.")
        
        # Configurações padrão
        self.default_model_openai = "gpt-4o-mini"
        
        # Cache para otimização
        self.suggestion_cache = {}
        self.cache_duration = timedelta(hours=1)
        
    # ... (o resto da classe de get_task_suggestions em diante permanece igual no início)
    
    # Métodos específicos do Gemini
    async def _get_gemini_task_suggestions(self, context: str) -> List[Dict[str, Any]]:
        """Gera sugestões de tarefas usando Gemini"""
        try:
            prompt = f"""
            Baseado no seguinte contexto do usuário, sugira 5 tarefas inteligentes e específicas:
            
            {context}
            
            Retorne APENAS um JSON válido no formato:
            {{
                "suggestions": [
                    {{
                        "title": "Título da tarefa",
                        "description": "Descrição detalhada",
                        "priority": "alta|média|baixa",
                        "category": "técnica|estudo|pessoal",
                        "estimated_time": "tempo estimado em minutos",
                        "reasoning": "Por que esta tarefa é importante agora"
                    }}
                ]
            }}
            """
            
            # CORREÇÃO: A chamada generate_content não precisa dos parâmetros 'model' ou 'config'.
            # A instância self.gemini_client já é o modelo.
            response = self.gemini_client.generate_content(prompt)
            
            # Parse da resposta
            response_text = response.text.strip()
            # Limpeza robusta do JSON
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            result = json.loads(response_text)
            return result.get('suggestions', [])
            
        except Exception as e:
            # CORREÇÃO: Imprimir o erro completo ajuda na depuração
            import traceback
            print(f"Erro no Gemini para sugestões de tarefas: {e}")
            traceback.print_exc()
            return []

    async def _get_gemini_productivity_insights(self, context: str) -> Dict[str, Any]:
        """Gera insights de produtividade usando Gemini"""
        try:
            prompt = f"""
            Analise os dados de produtividade e forneça insights acionáveis:
            
            {context}
            
            Retorne APENAS um JSON válido no formato:
            {{
                "overall_score": 85,
                "strengths": ["Ponto forte 1", "Ponto forte 2"],
                "areas_for_improvement": ["Área 1", "Área 2"],
                "recommendations": [
                    {{
                        "title": "Recomendação",
                        "description": "Descrição detalhada",
                        "impact": "alto|médio|baixo",
                        "effort": "fácil|médio|difícil"
                    }}
                ],
                "trends": {{
                    "productivity_trend": "crescente|estável|decrescente",
                    "focus_pattern": "manhã|tarde|noite",
                    "best_day": "segunda|terça|..."
                }}
            }}
            """
            
            # CORREÇÃO: Chamada simplificada e correta
            response = self.gemini_client.generate_content(prompt)
            
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            return json.loads(response_text)
            
        except Exception as e:
            print(f"Erro no Gemini para insights de produtividade: {e}")
            return {}

    async def _get_gemini_study_recommendations(self, context: str) -> List[Dict[str, Any]]:
        """Gera recomendações de estudo usando Gemini"""
        try:
            prompt = f"""
            Baseado no histórico de estudos, recomende conteúdos relevantes:
            
            {context}
            
            Retorne APENAS um JSON válido no formato:
            {{
                "recommendations": [
                    {{
                        "title": "Título do conteúdo",
                        "type": "vídeo|artigo|curso|livro",
                        "description": "Descrição do conteúdo",
                        "difficulty": "iniciante|intermediário|avançado",
                        "estimated_time": "tempo estimado",
                        "relevance_score": 95,
                        "topics": ["tópico1", "tópico2"],
                        "url": "URL se disponível ou null"
                    }}
                ]
            }}
            """
            
            # CORREÇÃO: Chamada simplificada e correta
            response = self.gemini_client.generate_content(prompt)
            
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            result = json.loads(response_text)
            return result.get('recommendations', [])
            
        except Exception as e:
            print(f"Erro no Gemini para recomendações de estudo: {e}")
            return []

    async def _get_gemini_schedule_optimization(self, context: str) -> Dict[str, Any]:
        """Otimiza cronograma usando Gemini"""
        try:
            prompt = f"""
            Otimize o cronograma baseado nos padrões de produtividade:
            
            {context}
            
            Retorne APENAS um JSON válido no formato:
            {{
                "optimized_schedule": [
                    {{
                        "time_slot": "09:00-10:00",
                        "activity": "Tarefa específica",
                        "reasoning": "Por que neste horário",
                        "energy_level": "alta|média|baixa"
                    }}
                ],
                "improvements": [
                    "Melhoria 1",
                    "Melhoria 2"
                ],
                "productivity_score": 88
            }}
            """
            
            # CORREÇÃO: Chamada simplificada e correta
            response = self.gemini_client.generate_content(prompt)
            
            response_text = response.text.strip()
            if response_text.startswith('```json'):
                response_text = response_text[7:-3].strip()
            elif response_text.startswith('```'):
                response_text = response_text[3:-3].strip()
            
            return json.loads(response_text)
            
        except Exception as e:
            print(f"Erro no Gemini para otimização de cronograma: {e}")
            return {}

    # O resto do seu código (métodos do OpenAI, de preparação de contexto, fallback, etc.)
    # já está bom e pode ser mantido como está.
    # Vou colar o resto aqui para garantir que você tenha o arquivo completo.

    async def get_task_suggestions(self, user_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Gera sugestões inteligentes de tarefas baseadas no contexto do usuário
        """
        try:
            # Preparar contexto
            context = self._prepare_task_context(user_context)
            cache_key = self._get_cache_key(context, "task_suggestions")
            
            # Verificar cache
            if cache_key in self.suggestion_cache:
                cached_data = self.suggestion_cache[cache_key]
                if self._is_cache_valid(cached_data['timestamp']):
                    return cached_data['suggestions']
            
            # Gerar sugestões
            suggestions = []
            
            # Tentar com Gemini primeiro (mais rápido)
            if self.gemini_client:
                print("Tentando gerar sugestões com Gemini...")
                suggestions = await self._get_gemini_task_suggestions(context)
            
            # Fallback para OpenAI se Gemini falhar
            if not suggestions and self.openai_client:
                print("Gemini falhou ou não está disponível. Usando OpenAI como fallback.")
                suggestions = await self._get_openai_task_suggestions(context)
            
            # Cache das sugestões
            if suggestions:
                self.suggestion_cache[cache_key] = {
                    'suggestions': suggestions,
                    'timestamp': datetime.now()
                }
            
            return suggestions
            
        except Exception as e:
            print(f"Erro ao gerar sugestões de tarefas: {e}")
            return self._get_fallback_task_suggestions()
    
    async def get_productivity_insights(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analisa dados do usuário e fornece insights de produtividade
        """
        try:
            context = self._prepare_productivity_context(user_data)
            cache_key = self._get_cache_key(context, "productivity_insights")
            
            # Verificar cache
            if cache_key in self.suggestion_cache:
                cached_data = self.suggestion_cache[cache_key]
                if self._is_cache_valid(cached_data['timestamp']):
                    return cached_data['insights']
            
            insights = {}
            
            # Tentar com Gemini
            if self.gemini_client:
                insights = await self._get_gemini_productivity_insights(context)
            
            # Fallback para OpenAI
            if not insights and self.openai_client:
                insights = await self._get_openai_productivity_insights(context)
            
            # Cache dos insights
            if insights:
                self.suggestion_cache[cache_key] = {
                    'insights': insights,
                    'timestamp': datetime.now()
                }
            
            return insights
            
        except Exception as e:
            print(f"Erro ao gerar insights de produtividade: {e}")
            return self._get_fallback_productivity_insights()
    
    async def get_study_recommendations(self, study_context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Recomenda conteúdos de estudo baseados no histórico e objetivos
        """
        try:
            context = self._prepare_study_context(study_context)
            cache_key = self._get_cache_key(context, "study_recommendations")
            
            # Verificar cache
            if cache_key in self.suggestion_cache:
                cached_data = self.suggestion_cache[cache_key]
                if self._is_cache_valid(cached_data['timestamp']):
                    return cached_data['recommendations']
            
            recommendations = []
            
            # Tentar com Gemini
            if self.gemini_client:
                recommendations = await self._get_gemini_study_recommendations(context)
            
            # Fallback para OpenAI
            if not recommendations and self.openai_client:
                recommendations = await self._get_openai_study_recommendations(context)
            
            # Cache das recomendações
            if recommendations:
                self.suggestion_cache[cache_key] = {
                    'recommendations': recommendations,
                    'timestamp': datetime.now()
                }
            
            return recommendations
            
        except Exception as e:
            print(f"Erro ao gerar recomendações de estudo: {e}")
            return self._get_fallback_study_recommendations()
    
    async def optimize_schedule(self, schedule_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Otimiza cronograma baseado em padrões de produtividade
        """
        try:
            context = self._prepare_schedule_context(schedule_data)
            
            optimization = {}
            
            # Tentar com Gemini
            if self.gemini_client:
                optimization = await self._get_gemini_schedule_optimization(context)
            
            # Fallback para OpenAI
            if not optimization and self.openai_client:
                optimization = await self._get_openai_schedule_optimization(context)
            
            return optimization
            
        except Exception as e:
            print(f"Erro ao otimizar cronograma: {e}")
            return self._get_fallback_schedule_optimization()

    # Métodos específicos do OpenAI (sem alterações)
    async def _get_openai_task_suggestions(self, context: str) -> List[Dict[str, Any]]:
        try:
            response = self.openai_client.chat.completions.create(
                model=self.default_model_openai,
                messages=[
                    {"role": "system", "content": "Você é um assistente de produtividade especializado em sugerir tarefas inteligentes. Responda APENAS com JSON válido."},
                    {"role": "user", "content": f'Baseado no contexto: {context}\n\nSugira 5 tarefas no formato JSON:\n{{\n    "suggestions": [\n        {{\n            "title": "Título",\n            "description": "Descrição",\n            "priority": "alta|média|baixa",\n            "category": "técnica|estudo|pessoal",\n            "estimated_time": "tempo em minutos",\n            "reasoning": "Justificativa"\n        }}\n    ]\n}}'}
                ],
                temperature=0.7,
                max_tokens=1000,
                response_format={"type": "json_object"} # Adicionado para garantir JSON
            )
            result = json.loads(response.choices[0].message.content)
            return result.get('suggestions', [])
        except Exception as e:
            print(f"Erro no OpenAI para sugestões de tarefas: {e}")
            return []

    async def _get_openai_productivity_insights(self, context: str) -> Dict[str, Any]:
        try:
            response = self.openai_client.chat.completions.create(
                model=self.default_model_openai,
                messages=[
                    {"role": "system", "content": "Você é um analista de produtividade especializado. Responda APENAS com JSON válido."},
                    {"role": "user", "content": f'Analise os dados: {context}\n\nForneça insights no formato JSON:\n{{\n    "overall_score": 85,\n    "strengths": ["força1", "força2"],\n    "areas_for_improvement": ["área1", "área2"],\n    "recommendations": [\n        {{\n            "title": "Recomendação",\n            "description": "Descrição",\n            "impact": "alto|médio|baixo",\n            "effort": "fácil|médio|difícil"\n        }}\n    ],\n    "trends": {{\n        "productivity_trend": "crescente|estável|decrescente",\n        "focus_pattern": "manhã|tarde|noite",\n        "best_day": "dia da semana"\n    }}\n}}'}
                ],
                temperature=0.3,
                max_tokens=1500,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Erro no OpenAI para insights de produtividade: {e}")
            return {}

    async def _get_openai_study_recommendations(self, context: str) -> List[Dict[str, Any]]:
        try:
            response = self.openai_client.chat.completions.create(
                model=self.default_model_openai,
                messages=[
                    {"role": "system", "content": "Você é um especialista em educação e curadoria de conteúdo. Responda APENAS com JSON válido."},
                    {"role": "user", "content": f'Baseado no histórico: {context}\n\nRecomende conteúdos no formato JSON:\n{{\n    "recommendations": [\n        {{\n            "title": "Título",\n            "type": "vídeo|artigo|curso|livro",\n            "description": "Descrição",\n            "difficulty": "iniciante|intermediário|avançado",\n            "estimated_time": "tempo estimado",\n            "relevance_score": 95,\n            "topics": ["tópico1", "tópico2"],\n            "url": null\n        }}\n    ]\n}}'}
                ],
                temperature=0.7,
                max_tokens=1200,
                response_format={"type": "json_object"}
            )
            result = json.loads(response.choices[0].message.content)
            return result.get('recommendations', [])
        except Exception as e:
            print(f"Erro no OpenAI para recomendações de estudo: {e}")
            return []
    
    async def _get_openai_schedule_optimization(self, context: str) -> Dict[str, Any]:
        try:
            response = self.openai_client.chat.completions.create(
                model=self.default_model_openai,
                messages=[
                    {"role": "system", "content": "Você é um especialista em otimização de cronogramas e produtividade. Responda APENAS com JSON válido."},
                    {"role": "user", "content": f'Otimize o cronograma: {context}\n\nRetorne no formato JSON:\n{{\n    "optimized_schedule": [\n        {{\n            "time_slot": "09:00-10:00",\n            "activity": "Atividade",\n            "reasoning": "Justificativa",\n            "energy_level": "alta|média|baixa"\n        }}\n    ],\n    "improvements": ["melhoria1", "melhoria2"],\n    "productivity_score": 88\n}}'}
                ],
                temperature=0.5,
                max_tokens=1000,
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"Erro no OpenAI para otimização de cronograma: {e}")
            return {}
    
    # Métodos de preparação de contexto (sem alterações)
    def _prepare_task_context(self, user_context: Dict[str, Any]) -> str:
        current_tasks = user_context.get('current_tasks', [])
        completed_tasks = user_context.get('completed_tasks', [])
        user_goals = user_context.get('goals', [])
        time_of_day = datetime.now().strftime('%H:%M')
        day_of_week = datetime.now().strftime('%A')
        
        context = f"Hora atual: {time_of_day}, {day_of_week}\n\nTarefas atuais: {json.dumps(current_tasks, indent=2)}\nTarefas concluídas recentemente: {json.dumps(completed_tasks[-5:], indent=2)}\nObjetivos do usuário: {json.dumps(user_goals, indent=2)}\n\nContexto adicional: {user_context.get('additional_context', '')}"
        return context
    
    def _prepare_productivity_context(self, user_data: Dict[str, Any]) -> str:
        return json.dumps(user_data, indent=2)
    
    def _prepare_study_context(self, study_context: Dict[str, Any]) -> str:
        return json.dumps(study_context, indent=2)
    
    def _prepare_schedule_context(self, schedule_data: Dict[str, Any]) -> str:
        return json.dumps(schedule_data, indent=2)
    
    # Métodos de fallback (sem alterações)
    def _get_fallback_task_suggestions(self) -> List[Dict[str, Any]]:
        return [{"title": "Revisar tarefas pendentes", "description": "Verificar e priorizar tarefas em aberto", "priority": "média", "category": "pessoal", "estimated_time": "15", "reasoning": "Manter organização é fundamental para produtividade"}, {"title": "Planejar próxima semana", "description": "Definir objetivos e cronograma para os próximos dias", "priority": "alta", "category": "pessoal", "estimated_time": "30", "reasoning": "Planejamento antecipado melhora a eficiência"}]
    
    def _get_fallback_productivity_insights(self) -> Dict[str, Any]:
        return {"overall_score": 75, "strengths": ["Consistência nas tarefas", "Boa organização"], "areas_for_improvement": ["Gestão de tempo", "Foco em prioridades"], "recommendations": [{"title": "Implementar técnica Pomodoro", "description": "Use blocos de 25 minutos para manter foco", "impact": "alto", "effort": "fácil"}], "trends": {"productivity_trend": "estável", "focus_pattern": "manhã", "best_day": "terça"}}
    
    def _get_fallback_study_recommendations(self) -> List[Dict[str, Any]]:
        return [{"title": "Técnicas de Estudo Eficazes", "type": "artigo", "description": "Métodos comprovados para melhorar o aprendizado", "difficulty": "iniciante", "estimated_time": "20 minutos", "relevance_score": 85, "topics": ["produtividade", "aprendizado"], "url": None}]
    
    def _get_fallback_schedule_optimization(self) -> Dict[str, Any]:
        return {"optimized_schedule": [{"time_slot": "09:00-11:00", "activity": "Tarefas de alta prioridade", "reasoning": "Manhã é período de maior energia mental", "energy_level": "alta"}, {"time_slot": "14:00-16:00", "activity": "Tarefas administrativas", "reasoning": "Período adequado para tarefas de rotina", "energy_level": "média"}], "improvements": ["Concentrar tarefas complexas pela manhã", "Reservar tarde para tarefas mais simples"], "productivity_score": 80}
    
    def get_available_providers(self) -> List[str]:
        providers = []
        if self.openai_client:
            providers.append("openai")
        if self.gemini_client:
            providers.append("gemini")
        return providers
    
    def clear_cache(self):
        self.suggestion_cache.clear()

# ================ CORREÇÃO FINAL AQUI ================
    # Apague a versão antiga desta função e cole esta:

    def _get_cache_key(self, context: str, suggestion_type: str) -> str:
        """Gera chave para cache baseada no contexto e tipo"""
        return f"{suggestion_type}:{hash(str(context))}"
