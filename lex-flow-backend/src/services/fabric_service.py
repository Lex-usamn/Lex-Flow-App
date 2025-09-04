# /opt/lex-flow-backend/src/services/fabric_service.py

import os
import dotenv
import google.generativeai as genai

dotenv.load_dotenv()

# --- Configuração do Cliente Gemini ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
gemini_model = None
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        print("✅ Serviço de IA configurado para usar Google Gemini.")
    except Exception as e:
        print(f"❌ Erro ao configurar o Google Gemini: {e}")
else:
    print("⚠️ Chave de API do Gemini (GEMINI_API_KEY) não encontrada no .env.")

# --- Dicionário de Prompts (Nossos "Patterns" ou "Lentes") ---
PROMPTS = {
    "summary": """
        Você é um coach de produtividade. Dada a 'Constituição Pessoal (Framework TELOS)' do usuário e suas 'Reflexões Diárias', gere um relatório conciso em Markdown com os seguintes tópicos: ## Resumo do Período, ## Obstáculo Principal, ## Maior Progresso, e ## Sugestão Acionável.
    """,
    "red_team": """
        Você é um 'Red Teamer' de pensamento crítico e brutalmente honesto. Compare a 'Constituição Pessoal (Framework TELOS)' do usuário com suas 'Reflexões Diárias'. Sua única tarefa é apontar 4 a 5 inconsistências claras entre o que o usuário DIZ que quer (framework) e o que ele FAZ (diário). Seja direto e desafiador.
    """,
    "blindspots": """
        Você é um analista de dados comportamentais. Analise as 'Reflexões Diárias' à luz da 'Constituição Pessoal' para encontrar pontos cegos. Identifique 4 a 5 padrões ocultos, contradições ou correlações que o usuário provavelmente não está vendo. Apresente como uma lista em Markdown.
    """,
    "encouragement": """
        Você é um coach motivacional. Analise as 'Reflexões Diárias' e a 'Constituição Pessoal' do usuário. Gere uma mensagem de encorajamento com 3 a 4 parágrafos que seja específica, validando suas dificuldades, celebrando seus progressos e reforçando que ele está no caminho certo para atingir suas missões.
    """,
    "chat": """
        Você é um coach de produtividade conversando com um usuário. Use a 'Constituição Pessoal (Framework TELOS)' e as 'Reflexões Diárias' como CONTEXTO para responder à PERGUNTA do usuário. Conecte as ações diárias aos objetivos de longo prazo.
    """
}

def _run_gemini(prompt: str) -> str:
    if not gemini_model:
        return "Erro: O modelo Gemini não foi inicializado. Verifique sua chave de API."
    try:
        safety_settings=[{"category":"HARM_CATEGORY_HARASSMENT","threshold":"BLOCK_NONE"},{"category":"HARM_CATEGORY_HATE_SPEECH","threshold":"BLOCK_NONE"},{"category":"HARM_CATEGORY_SEXUALLY_EXPLICIT","threshold":"BLOCK_NONE"},{"category":"HARM_CATEGORY_DANGEROUS_CONTENT","threshold":"BLOCK_NONE"}]
        response = gemini_model.generate_content(prompt, safety_settings=safety_settings)
        return response.text
    except Exception as e:
        return f"Erro na comunicação com a API do Gemini: {str(e)}"

def run_pattern(pattern_name: str, framework_context: str, daily_context: str, question: str = "") -> str:
    if pattern_name not in PROMPTS:
        return "Erro: Pattern desconhecido."
    base_prompt = PROMPTS[pattern_name]
    full_prompt = (f"{base_prompt}\n\n"
                   f"--- CONSTITUIÇÃO PESSOAL (FRAMEWORK TELOS) ---\n{framework_context}\n\n"
                   f"--- REFLEXÕES DIÁRIAS ---\n{daily_context}\n\n")
    if pattern_name == 'chat':
        full_prompt += f"--- PERGUNTA DO USUÁRIO ---\n{question}"
    return _run_gemini(full_prompt)